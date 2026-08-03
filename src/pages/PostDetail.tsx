import {useEffect,useMemo,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {CartesianGrid,Line,LineChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {ArrowLeft,ArrowUpRight,CalendarDays,Eye,Heart,Images,MessageCircle,Play,RefreshCw,Trophy,Users} from 'lucide-react';
import {api,errorMessage} from '../api';

type Row=Record<string,any>;
const compact=(value:any)=>new Intl.NumberFormat('pt-BR',{notation:Number(value)>9999?'compact':'standard',maximumFractionDigits:1}).format(Number(value)||0);
const dateTime=(value:any)=>value?new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'—';
const chartDate=(value:any)=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(value));
const percent=(value:any)=>`${Number(value||0).toFixed(2).replace('.',',')}%`;
const metricLabels:Record<string,string>={engagement_count:'Engajamento',likes_count:'Curtidas',comments_count:'Comentários',plays_count:'Reproduções',views_count:'Visualizações'};

function Delta({value}:{value:any}){const amount=Number(value||0);return <span className={amount>0?'positive':''}>{amount>0?'+':''}{compact(amount)} desde a primeira coleta</span>}

export default function PostDetail(){
  const {id}=useParams();const [data,setData]=useState<Row|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [metric,setMetric]=useState('engagement_count');
  async function load(){setLoading(true);setError('');try{setData((await api.get(`/posts/${id}/dashboard`)).data)}catch(e){setError(errorMessage(e))}finally{setLoading(false)}}
  useEffect(()=>{load()},[id]);
  const chart=useMemo(()=>(data?.history||[]).map((point:Row)=>({...point,label:chartDate(point.collected_at)})),[data]);
  if(loading)return <div className="post-detail-state"><RefreshCw className="spin"/>Carregando desempenho real da publicação…</div>;
  if(error||!data)return <div className="post-detail-state error"><Images/><b>{error||'Publicação não encontrada.'}</b><Link to="/comparisons">Voltar para comparações</Link></div>;
  const {post,growth,ranking}=data;const hashtags=String(post.hashtags||'').split(',').filter(Boolean);
  return <div className="post-detail">
    <div className="post-detail-top"><Link to="/comparisons"><ArrowLeft/> Voltar ao ranking</Link><a href={post.post_url} target="_blank" rel="noreferrer">Abrir no Instagram <ArrowUpRight/></a></div>
    <section className="post-detail-hero">
      <div className="post-detail-media">{post.display_url?<img src={post.display_url} alt={post.caption||'Publicação do Instagram'}/>:<Images/>}</div>
      <div className="post-detail-copy"><span>DESEMPENHO DA PUBLICAÇÃO</span><div className="post-author"><div className="post-author-avatar"><Users/>{post.profile_picture_url&&<img src={`/api/media/profiles/${post.profile_id}/picture`} alt={`@${post.username}`} onError={event=>{event.currentTarget.style.display='none'}}/>}</div><div><b>@{post.username}</b><small>{post.full_name||'Perfil monitorado'}</small></div></div><h1>{post.caption||'Publicação sem legenda'}</h1><div className="post-meta"><span><CalendarDays/> Publicada em {dateTime(post.published_at)}</span><span>{post.post_type||post.type||'Conteúdo'}</span><span>{data.daysOnline} dias online</span></div>{hashtags.length>0&&<div className="post-tags">{hashtags.map((tag:string)=><span key={tag}>#{tag.replace(/^#/,'')}</span>)}</div>}</div>
    </section>
    <div className="post-detail-kpis">
      <article><Heart/><span>Curtidas</span><strong>{compact(post.likes_count)}</strong><Delta value={growth.likes}/></article>
      <article><MessageCircle/><span>Comentários</span><strong>{compact(post.comments_count)}</strong><Delta value={growth.comments}/></article>
      <article><Trophy/><span>Engajamento</span><strong>{compact(post.engagement_count)}</strong><small>{percent(post.engagement_rate)} · {compact(data.engagementPerDay)}/dia</small></article>
      <article><Play/><span>Reproduções</span><strong>{compact(post.plays_count)}</strong><Delta value={growth.plays}/></article>
      <article><Eye/><span>Visualizações</span><strong>{compact(post.views_count)}</strong><Delta value={growth.views}/></article>
      <article><Trophy/><span>Ranking no perfil</span><strong>#{Number(ranking?.position||1)}</strong><small>entre {compact(ranking?.total)} publicações</small></article>
    </div>
    <div className="post-detail-grid">
      <section className="post-detail-panel history-panel"><div className="post-detail-panel-head"><div><span>EVOLUÇÃO REAL</span><h2>Da publicação até hoje</h2><p>{data.historyNotice}</p></div><select value={metric} onChange={e=>setMetric(e.target.value)}>{Object.entries(metricLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>{chart.length>1?<ResponsiveContainer width="100%" height={300}><LineChart data={chart} margin={{left:-10,right:15,top:12}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="collected_at" tickFormatter={chartDate}/><YAxis tickFormatter={compact}/><Tooltip labelFormatter={dateTime} formatter={(value:any)=>[compact(value),metricLabels[metric]]}/><Line type="monotone" dataKey={metric} stroke="#7455e7" strokeWidth={3} dot={{r:4,fill:'#7455e7'}}/></LineChart></ResponsiveContainer>:<div className="history-empty"><RefreshCw/><b>Aguardando a próxima coleta</b><span>O primeiro ponto já foi registrado. Uma nova sincronização mostrará a variação real, sem estimativas.</span></div>}</section>
      <section className="post-detail-panel comments-panel"><div className="post-detail-panel-head"><div><span>INTERAÇÕES</span><h2>Comentários recentes</h2><p>{data.comments.length} comentários coletados</p></div></div>{data.comments.length?<div className="comment-list">{data.comments.map((comment:Row)=><article key={comment.id}>{comment.owner_profile_picture_url?<img src={comment.owner_profile_picture_url} alt=""/>:<div className="comment-avatar">{String(comment.owner_username||'?')[0].toUpperCase()}</div>}<div><b>@{comment.owner_username||'instagram'}</b><p>{comment.text}</p><small>{dateTime(comment.commented_at)} · {compact(comment.likes_count)} curtidas · {compact(comment.replies_count)} respostas</small></div></article>)}</div>:<div className="history-empty compact"><MessageCircle/><b>Nenhum comentário coletado</b><span>O scraper ainda não retornou interações para esta publicação.</span></div>}</section>
    </div>
  </div>
}
