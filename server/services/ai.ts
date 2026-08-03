import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';

export type AiProvider='openai'|'anthropic';
export type ProfileAnalysis={
  executiveSummary:string;overallScore:number;
  diagnosis:Array<{area:'performance'|'interaction'|'followers'|'sales';score:number;finding:string;evidence:string}>;
  priorities:Array<{priority:'high'|'medium'|'low';area:string;title:string;why:string;action:string;expectedImpact:string;timeframe:string}>;
  contentIdeas:Array<{title:string;format:string;objective:string;hook:string;callToAction:string}>;
  competitiveInsights:Array<{competitor:string;whatWorks:string;evidence:string;adaptation:string}>;
  publishingPlan:Array<{day:string;time:string;format:string;theme:string;objective:string;callToAction:string;rationale:string}>;
  hashtagStrategy:{recommended:string[];experiments:string[];avoid:string[];guidance:string};
  paidMediaPlan:{objective:string;audiences:string[];creative:string;conversionPath:string;primaryMetric:string;testPlan:string;caveat:string};
  salesFunnel:{awareness:string;consideration:string;conversion:string};risks:string[];
};

const analysisSchema={type:'object',additionalProperties:false,required:['executiveSummary','overallScore','diagnosis','priorities','contentIdeas','competitiveInsights','publishingPlan','hashtagStrategy','paidMediaPlan','salesFunnel','risks'],properties:{
  executiveSummary:{type:'string'},overallScore:{type:'integer',minimum:0,maximum:100},
  diagnosis:{type:'array',items:{type:'object',additionalProperties:false,required:['area','score','finding','evidence'],properties:{area:{type:'string',enum:['performance','interaction','followers','sales']},score:{type:'integer',minimum:0,maximum:100},finding:{type:'string'},evidence:{type:'string'}}}},
  priorities:{type:'array',items:{type:'object',additionalProperties:false,required:['priority','area','title','why','action','expectedImpact','timeframe'],properties:{priority:{type:'string',enum:['high','medium','low']},area:{type:'string'},title:{type:'string'},why:{type:'string'},action:{type:'string'},expectedImpact:{type:'string'},timeframe:{type:'string'}}}},
  contentIdeas:{type:'array',items:{type:'object',additionalProperties:false,required:['title','format','objective','hook','callToAction'],properties:{title:{type:'string'},format:{type:'string'},objective:{type:'string'},hook:{type:'string'},callToAction:{type:'string'}}}},
  competitiveInsights:{type:'array',items:{type:'object',additionalProperties:false,required:['competitor','whatWorks','evidence','adaptation'],properties:{competitor:{type:'string'},whatWorks:{type:'string'},evidence:{type:'string'},adaptation:{type:'string'}}}},
  publishingPlan:{type:'array',items:{type:'object',additionalProperties:false,required:['day','time','format','theme','objective','callToAction','rationale'],properties:{day:{type:'string'},time:{type:'string'},format:{type:'string'},theme:{type:'string'},objective:{type:'string'},callToAction:{type:'string'},rationale:{type:'string'}}}},
  hashtagStrategy:{type:'object',additionalProperties:false,required:['recommended','experiments','avoid','guidance'],properties:{recommended:{type:'array',items:{type:'string'}},experiments:{type:'array',items:{type:'string'}},avoid:{type:'array',items:{type:'string'}},guidance:{type:'string'}}},
  paidMediaPlan:{type:'object',additionalProperties:false,required:['objective','audiences','creative','conversionPath','primaryMetric','testPlan','caveat'],properties:{objective:{type:'string'},audiences:{type:'array',items:{type:'string'}},creative:{type:'string'},conversionPath:{type:'string'},primaryMetric:{type:'string'},testPlan:{type:'string'},caveat:{type:'string'}}},
  salesFunnel:{type:'object',additionalProperties:false,required:['awareness','consideration','conversion'],properties:{awareness:{type:'string'},consideration:{type:'string'},conversion:{type:'string'}}},
  risks:{type:'array',items:{type:'string'}}
}} as const;

function encryptionKey(secret:string){return createHash('sha256').update(secret).digest()}
export function encryptSecret(value:string,secret:string){const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',encryptionKey(secret),iv);const encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return `v1:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${encrypted.toString('base64')}`}
export function decryptSecret(value:string,secret:string){const [version,iv,tag,payload]=value.split(':');if(version!=='v1'||!iv||!tag||!payload)throw new Error('Credencial de IA inválida. Salve a chave novamente.');const decipher=createDecipheriv('aes-256-gcm',encryptionKey(secret),Buffer.from(iv,'base64'));decipher.setAuthTag(Buffer.from(tag,'base64'));return Buffer.concat([decipher.update(Buffer.from(payload,'base64')),decipher.final()]).toString('utf8')}

function readOutputText(response:any){if(typeof response?.output_text==='string')return response.output_text;for(const item of response?.output||[])for(const content of item?.content||[])if(typeof content?.text==='string')return content.text;return ''}
function safeProviderError(response:Response,body:any){if(response.status===401||response.status===403)return'Chave da API inválida ou sem permissão. Confira a credencial do provedor.';if(response.status===429)return'O provedor recusou a solicitação por limite de uso ou saldo. Confira os créditos e tente novamente.';const raw=String(body?.error?.message||body?.message||'').replace(/sk-[a-zA-Z0-9_-]+/g,'sk-••••').replace(/(api[_ -]?key["':= ]+)[^\s,;]+/gi,'$1••••');return raw||`Falha no provedor de IA (${response.status}).`}
async function checkedJson(response:Response){const body=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new Error(safeProviderError(response,body)),{status:502});return body}
async function request(url:string,init:RequestInit,timeoutMs=60_000){const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),timeoutMs);try{return await fetch(url,{...init,signal:controller.signal})}catch(error){if((error as Error).name==='AbortError')throw Object.assign(new Error(`O provedor de IA demorou mais de ${Math.round(timeoutMs/1000)} segundos para responder.`),{status:504});throw Object.assign(new Error('Não foi possível conectar ao provedor de IA.'),{status:502})}finally{clearTimeout(timeout)}}

export async function testAiConnection(provider:AiProvider,model:string,apiKey:string){
  if(provider==='openai'){const response=await request('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model,input:'Responda somente com OK.',max_output_tokens:16,store:false})});await checkedJson(response);return}
  const response=await request('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model,max_tokens:16,messages:[{role:'user',content:'Responda somente com OK.'}]})});await checkedJson(response);
}

export async function generateProfileAnalysis(provider:AiProvider,model:string,apiKey:string,data:unknown):Promise<ProfileAnalysis>{
  const instructions='Atue como um gestor sênior de marketing, tráfego pago e social media especializado em Instagram. Analise exclusivamente os dados fornecidos, sem inventar métricas. Compare o perfil base com cada concorrente, identifique padrões de formatos, temas, hashtags, frequência, dias e horários. Diferencie correlação de causalidade e evidência de hipótese. Responda em português do Brasil, com ações específicas, mensuráveis e aplicáveis. Não copie conteúdo de concorrentes: transforme padrões em ideias originais. Vendas e mídia paga não são diretamente observadas; trate conversão, público e orçamento como hipóteses de teste quando não houver dados de receita, pixel ou campanhas.';
  const input=`Crie um plano estratégico para o perfil base melhorar performance, interação, seguidores e vendas. Use os benchmarks e posts líderes dos perfis de comparação. Entregue: diagnóstico, vantagens e lacunas competitivas, prioridades, ideias de posts, calendário semanal com melhores datas/horários disponíveis, estratégia de hashtags baseada no histórico, funil de vendas e plano inicial de mídia paga. Quando a amostra não sustentar uma recomendação, diga isso no campo de justificativa. Dados:\n${JSON.stringify(data)}`;
  let text='';
  if(provider==='openai'){
    const response=await request('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model,instructions,input,reasoning:{effort:'low'},text:{format:{type:'json_schema',name:'profile_analysis',strict:true,schema:analysisSchema}},store:false})},180_000);
    text=readOutputText(await checkedJson(response));
  }else{
    const response=await request('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model,max_tokens:7000,system:instructions,messages:[{role:'user',content:input}],output_config:{format:{type:'json_schema',schema:analysisSchema}}})},180_000);
    const body=await checkedJson(response);text=(body?.content||[]).map((item:any)=>item?.text||'').join('');
  }
  if(!text)throw Object.assign(new Error('O provedor não retornou uma análise utilizável.'),{status:502});
  try{return JSON.parse(text) as ProfileAnalysis}catch{throw Object.assign(new Error('O provedor retornou uma análise em formato inválido.'),{status:502})}
}
