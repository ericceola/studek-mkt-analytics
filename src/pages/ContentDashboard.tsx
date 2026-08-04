import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Link,useParams,useSearchParams} from 'react-router-dom';
import {Bar,BarChart,CartesianGrid,Cell,ComposedChart,Line,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {Activity,ArrowUpRight,CalendarDays,Camera as Instagram,Download,FileText,Heart,MessageCircle,Play,Printer,RefreshCw,Search,SlidersHorizontal,Sparkles,TrendingUp} from 'lucide-react';
import {api,errorMessage} from '../api';
import {exportElementToLandscapePdf} from '../utils/exportPdf';
import {PostThumbnail} from '../components/PostThumbnail';

type Row=Record<string,any>;
const palette=['#7140a4','#9a64c7','#c49be5','#34a98b','#f2a444'];
const formatNames:Record<string,string>={Reel:'Reel',Video:'Vídeo',Image:'Imagem',Sidecar:'Carrossel',Other:'Outro'};
const metricNames:Record<string,string>={engagement:'Engajamento',likes:'Curtidas',comments:'Comentários',plays:'Reproduções',views:'Visualizações',posts:'Publicações'};
const compact=(value:any)=>new Intl.NumberFormat('pt-BR',{notation:Number(value)>9999?'compact':'standard',maximumFractionDigits:1}).format(Number(value)||0);
const full=(value:any)=>new Intl.NumberFormat('pt-BR').format(Math.round(Number(value)||0));
const postDate=(value:any)=>new Intl.DateTimeFormat('pt-BR').format(new Date(value));
const month=(value:string)=>{const [year,m]=value.split('-');return new Intl.DateTimeFormat('pt-BR',{month:'short',year:'2-digit'}).format(new Date(Number(year),Number(m)-1,1));};
const csvCell=(value:any)=>`"${String(value??'').replaceAll('"','""')}"`;

function ChartEmpty(){return <div className="content-empty"><Activity/><b>Sem dados no período</b><span>Ajuste os filtros ou realize uma coleta.</span></div>}
function ContentCard({title,subtitle,action,children,className=''}:{title:string;subtitle:string;action?:React.ReactNode;children:React.ReactNode;className?:string}){return <section className={`content-card ${className}`}><div className="content-card-head"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>{children}</section>}

export default function ContentDashboard(){
  const {id}=useParams(); const [searchParams]=useSearchParams(); const comparisonView=searchParams.get('view')==='comparison'; const [data,setData]=useState<Row|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  const [syncing,setSyncing]=useState(false); const [syncMessage,setSyncMessage]=useState('');const [pdfExporting,setPdfExporting]=useState(false);
  const syncInFlight=useRef(false);
  const [draft,setDraft]=useState({from:'',to:'',type:'',search:''}); const [filters,setFilters]=useState(draft); const [metric,setMetric]=useState('engagement'); const [ranking,setRanking]=useState('engagement_count');
  const emptyTableFilters={from:'',to:'',type:'',search:'',minLikes:'',minComments:'',minEngagement:'',minPlays:'',minViews:'',sort:'date_desc'};
  const [tableFilters,setTableFilters]=useState(emptyTableFilters);
  const load=useCallback(async()=>{setLoading(true);setError('');try{const response=await api.get(`/profiles/${id}/content-dashboard`,{params:filters});setData(response.data)}catch(e){setError(errorMessage(e))}finally{setLoading(false)}},[id,filters]);
  useEffect(()=>{load()},[load]);
  const ranked=useMemo(()=>[...(data?.posts||[])].sort((a,b)=>Number(b[ranking])-Number(a[ranking])).slice(0,6),[data,ranking]);
  const tablePosts=useMemo(()=>{const search=tableFilters.search.trim().toLowerCase();const filtered=(data?.posts||[]).filter((post:Row)=>{const published=String(post.published_at||'').slice(0,10);if(tableFilters.from&&published<tableFilters.from)return false;if(tableFilters.to&&published>tableFilters.to)return false;if(tableFilters.type&&post.post_type!==tableFilters.type)return false;if(search&&!`${post.caption||''} ${post.hashtags||''}`.toLowerCase().includes(search))return false;if(tableFilters.minLikes&&Number(post.likes_count)<Number(tableFilters.minLikes))return false;if(tableFilters.minComments&&Number(post.comments_count)<Number(tableFilters.minComments))return false;if(tableFilters.minEngagement&&Number(post.engagement_count)<Number(tableFilters.minEngagement))return false;if(tableFilters.minPlays&&Number(post.plays_count)<Number(tableFilters.minPlays))return false;if(tableFilters.minViews&&Number(post.views_count)<Number(tableFilters.minViews))return false;return true});return filtered.sort((a:Row,b:Row)=>tableFilters.sort==='date_asc'?+new Date(a.published_at)-+new Date(b.published_at):tableFilters.sort==='date_desc'?+new Date(b.published_at)-+new Date(a.published_at):Number(b[tableFilters.sort])-Number(a[tableFilters.sort]))},[data,tableFilters]);
  const tableFiltersActive=Object.entries(tableFilters).some(([key,value])=>key==='sort'?value!=='date_desc':Boolean(value));
  const maxHash=Math.max(1,...(data?.hashtags||[]).map((h:Row)=>Number(h.engagement)));
  const summary=data?.summary||{}; const profile=data?.profile||{};
  function apply(){setFilters({...draft})}
  function reset(){const empty={from:'',to:'',type:'',search:''};setDraft(empty);setFilters(empty)}
  async function syncInstagram(){if(syncInFlight.current)return;syncInFlight.current=true;setSyncing(true);setSyncMessage('Iniciando o Instagram Scraper…');setError('');try{
    const started=await api.post(`/profiles/${id}/collect`,{type:'full'});const ids:number[]=started.data.ids||[started.data.id];
    for(let attempt=0;attempt<90;attempt++){setSyncMessage(attempt<2?'Coletando perfil, publicações, Reels e Stories…':'Processando os datasets retornados pela Apify…');await new Promise(resolve=>setTimeout(resolve,7000));
      const statuses=await Promise.all(ids.map(async runId=>{try{return (await api.post(`/runs/${runId}/refresh`)).data.status}catch{return (await api.get(`/runs/${runId}`)).data.status}}));
      if(statuses.some(status=>['failed','aborted','timed_out'].includes(status)))throw new Error('A coleta não foi concluída. Consulte a tela de Coletas para ver o motivo.');
      if(statuses.every(status=>status==='succeeded')){setSyncMessage('Dados atualizados com sucesso.');await load();setTimeout(()=>setSyncMessage(''),3500);return;}
    } throw new Error('A coleta continua em processamento. Acompanhe o status na tela de Coletas.');
  }catch(e){setError(errorMessage(e))}finally{syncInFlight.current=false;setSyncing(false)}}
  function exportCsv(){if(!data)return;const cols=['published_at','post_type','caption','hashtags','likes_count','comments_count','engagement_count','plays_count','views_count','post_url'];const csv='\uFEFF'+[cols.join(';'),...data.posts.map((p:Row)=>cols.map(c=>csvCell(p[c])).join(';'))].join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`conteudos-${profile.username||'instagram'}.csv`;a.click();URL.revokeObjectURL(url)}
  async function exportPdf(){setPdfExporting(true);setError('');try{await exportElementToLandscapePdf('.content-dashboard',`performance-${profile.username||'instagram'}.pdf`)}catch(e){setError(errorMessage(e))}finally{setPdfExporting(false)}}
  const monthly=(data?.monthly||[]).map((item:Row)=>({...item,label:month(item.key)}));
  return <div className="content-dashboard">
    <section className="content-hero"><div><span><Instagram/> @{profile.username||'perfil'}</span><h1>Dashboard de Conteúdo e Engajamento</h1><p>Leitura estratégica das publicações coletadas diretamente pelo Instagram Scraper.</p></div><div className="content-sync-area"><div className={`content-hero-status ${syncing?'syncing':''}`}><i/><span>{syncing?'Sincronizando com a Apify':comparisonView?'Modo de consulta':'Dados sincronizados'}</span><small>{syncMessage||(profile.last_collected_at?postDate(profile.last_collected_at):'Aguardando coleta')}</small></div>{!comparisonView&&<button className="content-sync" onClick={syncInstagram} disabled={syncing}><RefreshCw/>{syncing?'Coletando…':'Atualizar Instagram'}</button>}<button data-pdf-ignore className="dashboard-print on-dark" onClick={exportPdf} disabled={pdfExporting}><Printer/>{pdfExporting?'Gerando PDF…':'Baixar PDF'}</button></div></section>

    <section className="content-filters" aria-label="Filtros do dashboard">
      <label>Data inicial<input type="date" value={draft.from} onChange={e=>setDraft({...draft,from:e.target.value})}/></label>
      <label>Data final<input type="date" value={draft.to} onChange={e=>setDraft({...draft,to:e.target.value})}/></label>
      <label>Formato<select value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value})}><option value="">Todos</option><option value="Reel">Reels</option><option value="Video">Vídeos</option><option value="Image">Imagens</option><option value="Sidecar">Carrosséis</option></select></label>
      <label className="content-search">Buscar conteúdo<div><Search/><input value={draft.search} onChange={e=>setDraft({...draft,search:e.target.value})} onKeyDown={e=>e.key==='Enter'&&apply()} placeholder="Ex.: ETEC, prova, curso"/></div></label>
      <button className="content-filter-button" onClick={apply}><SlidersHorizontal/>Aplicar filtros</button>
      <button className="content-export" onClick={exportCsv} disabled={!data}><Download/>Baixar CSV</button>
      {(filters.from||filters.to||filters.type||filters.search)&&<button className="content-clear" onClick={reset}>Limpar filtros</button>}
    </section>

    {error&&<div className="content-error"><Activity/><div><b>Não foi possível carregar o dashboard</b><span>{error}</span></div><button onClick={load}><RefreshCw/>Tentar novamente</button></div>}
    {loading?<div className="content-loading"><span/><span/><span/>Carregando dados do Instagram…</div>:data&&<>
      <div className="content-kpis">
        <article><div className="kpi-icon purple"><FileText/></div><span>Publicações</span><strong>{full(summary.posts)}</strong><small>{summary.frequencyPerWeek?.toFixed(1).replace('.',',')} por semana</small></article>
        <article><div className="kpi-icon pink"><Heart/></div><span>Curtidas</span><strong>{compact(summary.likes)}</strong><small>{full(summary.averageLikes)} por conteúdo</small></article>
        <article><div className="kpi-icon blue"><MessageCircle/></div><span>Comentários</span><strong>{compact(summary.comments)}</strong><small>{full(summary.averageComments)} por conteúdo</small></article>
        <article><div className="kpi-icon green"><TrendingUp/></div><span>Engajamento</span><strong>{compact(summary.engagement)}</strong><small>{full(summary.averageEngagement)} por conteúdo</small></article>
        <article><div className="kpi-icon orange"><Play/></div><span>Reproduções</span><strong>{compact(summary.plays)}</strong><small>{compact(summary.views)} visualizações</small></article>
      </div>

      <div className="content-layout primary-grid">
        <ContentCard title="Evolução mensal" subtitle={`Soma de ${metricNames[metric].toLowerCase()} por mês`} action={<select className="content-card-select" value={metric} onChange={e=>setMetric(e.target.value)}>{Object.entries(metricNames).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>}>
          {monthly.length?<ResponsiveContainer width="100%" height={290}><ComposedChart data={monthly} margin={{top:16,right:12,left:-16,bottom:0}}><defs><linearGradient id="monthlyBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7845aa"/><stop offset="1" stopColor="#ab75cf"/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label"/><YAxis tickFormatter={compact}/><Tooltip formatter={(v:any)=>full(v)} labelStyle={{fontWeight:700}}/><Bar dataKey={metric} fill="url(#monthlyBar)" radius={[7,7,0,0]} maxBarSize={55}/><Line dataKey={metric} stroke="#4e236e" strokeWidth={2} dot={{r:3,fill:'#fff'}}/></ComposedChart></ResponsiveContainer>:<ChartEmpty/>}
        </ContentCard>
        <ContentCard title="Leitura executiva" subtitle="Destaques calculados a partir dos conteúdos" className="executive-card">
          <div className="executive-list"><article><div><Sparkles/></div><span>Formato mais eficiente</span><strong>{formatNames[data.insights.bestFormat]||'—'}</strong><small>Maior engajamento médio</small></article><article><div><CalendarDays/></div><span>Melhor dia para publicar</span><strong>{data.insights.bestDay||'—'}</strong><small>Com base no desempenho médio</small></article><article><div><TrendingUp/></div><span>Ritmo de publicação</span><strong>{summary.frequencyPerWeek?.toFixed(1).replace('.',',')} / semana</strong><small>{summary.posts} itens no recorte</small></article></div>
        </ContentCard>
      </div>

      <div className="content-layout secondary-grid">
        <ContentCard title="Desempenho por formato" subtitle="Engajamento médio e quantidade de publicações">
          {data.formats.length?<ResponsiveContainer width="100%" height={260}><BarChart data={data.formats} layout="vertical" margin={{left:4,right:30}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" tickFormatter={compact}/><YAxis type="category" dataKey="key" tickFormatter={v=>formatNames[v]||v} width={70}/><Tooltip formatter={(v:any)=>full(v)}/><Bar dataKey="averageEngagement" name="Engajamento médio" radius={[0,7,7,0]}>{data.formats.map((_:Row,i:number)=><Cell key={i} fill={palette[i%palette.length]}/>)}</Bar></BarChart></ResponsiveContainer>:<ChartEmpty/>}
        </ContentCard>
        <ContentCard title="Publicações por dia da semana" subtitle="Volume e engajamento médio">
          {data.weekdays.length?<ResponsiveContainer width="100%" height={260}><ComposedChart data={data.weekdays} margin={{left:-20,right:4}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="key"/><YAxis/><Tooltip formatter={(v:any)=>full(v)}/><Bar dataKey="posts" name="Posts" fill="#a979cc" radius={[6,6,0,0]}/><Line dataKey="averageEngagement" name="Eng. médio" stroke="#25a282" strokeWidth={3}/></ComposedChart></ResponsiveContainer>:<ChartEmpty/>}
        </ContentCard>
      </div>

      <div className="content-layout tertiary-grid">
        <ContentCard title="Top conteúdos" subtitle="Ranking das publicações filtradas" action={<select className="content-card-select" value={ranking} onChange={e=>setRanking(e.target.value)}><option value="engagement_count">Maior engajamento</option><option value="likes_count">Mais curtidas</option><option value="comments_count">Mais comentários</option><option value="plays_count">Mais reproduções</option><option value="views_count">Mais visualizações</option></select>}>
          {ranked.length?<div className="top-content-list">{ranked.map((post:Row,index:number)=><Link to={`/posts/${post.id}`} key={post.id}><span className="top-position">{index+1}</span><div className="top-thumb">{post.display_url?<PostThumbnail postId={post.id}/>:<Instagram/>}<i>{formatNames[post.post_type]||post.post_type}</i></div><div className="top-copy"><b>{post.caption||'Publicação sem legenda'}</b><small>{postDate(post.published_at)} · {String(post.hashtags).split(',').filter(Boolean).slice(0,3).map((h:string)=>`#${h}`).join(' ')}</small></div><div className="top-numbers"><span><Heart/>{compact(post.likes_count)}</span><span><MessageCircle/>{compact(post.comments_count)}</span><strong>{compact(post.engagement_count)}<small>engajamentos</small></strong></div><ArrowUpRight/></Link>)}</div>:<ChartEmpty/>}
        </ContentCard>
        <ContentCard title="Hashtags" subtitle="Engajamento acumulado e quantidade de usos">
          {data.hashtags.length?<div className="hashtag-list">{data.hashtags.slice(0,10).map((tag:Row)=><div key={tag.name}><div><b>#{tag.name}</b><span>{tag.uses} {tag.uses===1?'uso':'usos'}</span></div><i><em style={{width:`${tag.engagement/maxHash*100}%`}}/></i><strong>{compact(tag.engagement)}</strong></div>)}</div>:<ChartEmpty/>}
        </ContentCard>
      </div>

      <ContentCard title="Base detalhada" subtitle={`${tablePosts.length} de ${data.posts.length} publicações exibidas`} action={<button data-pdf-ignore className="content-print" onClick={exportPdf} disabled={pdfExporting}><FileText/>{pdfExporting?'Gerando PDF…':'Baixar PDF'}</button>} className="content-table-card">
        <div className="detail-filters"><div className="detail-filters-head"><span><SlidersHorizontal/>Filtros da tabela</span>{tableFiltersActive&&<button onClick={()=>setTableFilters(emptyTableFilters)}>Limpar filtros</button>}</div><div className="detail-filters-grid"><label>Data inicial<input type="date" value={tableFilters.from} onChange={e=>setTableFilters({...tableFilters,from:e.target.value})}/></label><label>Data final<input type="date" value={tableFilters.to} onChange={e=>setTableFilters({...tableFilters,to:e.target.value})}/></label><label>Formato<select value={tableFilters.type} onChange={e=>setTableFilters({...tableFilters,type:e.target.value})}><option value="">Todos</option><option value="Reel">Reels</option><option value="Video">Vídeos</option><option value="Image">Imagens</option><option value="Sidecar">Carrosséis</option></select></label><label className="detail-filter-search">Legenda ou hashtag<div><Search/><input value={tableFilters.search} onChange={e=>setTableFilters({...tableFilters,search:e.target.value})} placeholder="Buscar conteúdo"/></div></label><label>Curtidas mín.<input type="number" min="0" value={tableFilters.minLikes} onChange={e=>setTableFilters({...tableFilters,minLikes:e.target.value})} placeholder="0"/></label><label>Comentários mín.<input type="number" min="0" value={tableFilters.minComments} onChange={e=>setTableFilters({...tableFilters,minComments:e.target.value})} placeholder="0"/></label><label>Engajamento mín.<input type="number" min="0" value={tableFilters.minEngagement} onChange={e=>setTableFilters({...tableFilters,minEngagement:e.target.value})} placeholder="0"/></label><label>Reproduções mín.<input type="number" min="0" value={tableFilters.minPlays} onChange={e=>setTableFilters({...tableFilters,minPlays:e.target.value})} placeholder="0"/></label><label>Visualizações mín.<input type="number" min="0" value={tableFilters.minViews} onChange={e=>setTableFilters({...tableFilters,minViews:e.target.value})} placeholder="0"/></label><label>Ordenar por<select value={tableFilters.sort} onChange={e=>setTableFilters({...tableFilters,sort:e.target.value})}><option value="date_desc">Mais recentes</option><option value="date_asc">Mais antigas</option><option value="likes_count">Mais curtidas</option><option value="comments_count">Mais comentários</option><option value="engagement_count">Maior engajamento</option><option value="plays_count">Mais reproduções</option><option value="views_count">Mais visualizações</option></select></label></div></div>
        {tablePosts.length?<div className="content-table-wrap"><table><thead><tr><th>Data</th><th>Formato</th><th>Legenda</th><th>Hashtags</th><th>Curtidas</th><th>Comentários</th><th>Engajamento</th><th>Reproduções</th><th>Visualizações</th><th>Post</th></tr></thead><tbody>{tablePosts.map((post:Row)=><tr key={post.id}><td>{postDate(post.published_at)}</td><td><span className={`format-pill ${post.post_type.toLowerCase()}`}>{formatNames[post.post_type]||post.post_type}</span></td><td className="caption-cell">{post.caption||'—'}</td><td className="tags-cell">{String(post.hashtags).split(',').filter(Boolean).slice(0,3).map((tag:string)=><span key={tag}>#{tag}</span>)}</td><td>{full(post.likes_count)}</td><td>{full(post.comments_count)}</td><td><b>{full(post.engagement_count)}</b></td><td>{full(post.plays_count)}</td><td>{full(post.views_count)}</td><td><Link to={`/posts/${post.id}`} aria-label="Ver desempenho da publicação"><ArrowUpRight/></Link></td></tr>)}</tbody></table></div>:<div className="detail-filter-empty"><Search/><b>Nenhuma publicação encontrada</b><span>Ajuste ou limpe os filtros da tabela.</span></div>}
        <p className="content-footnote">Engajamento = curtidas + comentários. Reproduções usam <b>videoPlayCount</b> e, quando ausente, <b>videoViewCount</b>. Datas são armazenadas em UTC e exibidas no horário local.</p>
      </ContentCard>
    </>}
  </div>
}
