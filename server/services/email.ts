import nodemailer from 'nodemailer';

export type SmtpConfiguration={host:string;port:number;secure:boolean;requireTls:boolean;user:string;password:string;fromName:string;fromAddress:string;replyTo?:string|null};

function transporter(configuration:SmtpConfiguration){
  return nodemailer.createTransport({
    host:configuration.host,port:configuration.port,secure:configuration.secure,requireTLS:configuration.requireTls,
    auth:configuration.user?{user:configuration.user,pass:configuration.password}:undefined,
    connectionTimeout:15_000,greetingTimeout:15_000,socketTimeout:25_000,
  });
}

export async function verifySmtp(configuration:SmtpConfiguration){const client=transporter(configuration);try{await client.verify()}finally{client.close()}}

export async function sendSystemEmail(configuration:SmtpConfiguration,message:{to:string;subject:string;text:string;html?:string}){
  const client=transporter(configuration);
  try{return await client.sendMail({from:{name:configuration.fromName,address:configuration.fromAddress},replyTo:configuration.replyTo||undefined,...message})}
  finally{client.close()}
}

export async function sendSmtpTest(configuration:SmtpConfiguration,to:string){
  await verifySmtp(configuration);
  return sendSystemEmail(configuration,{to,subject:'Teste de e-mail · Studek Analytics',text:'A configuração de e-mail do Studek Analytics está funcionando corretamente.',html:`<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;border:1px solid #e7e3ed;border-radius:14px"><div style="color:#7557ef;font-size:12px;font-weight:700;letter-spacing:.08em">STUDEK ANALYTICS</div><h1 style="font-size:24px;color:#211d2c">Configuração validada</h1><p style="color:#6f6978;line-height:1.6">O servidor SMTP foi conectado e esta mensagem de teste foi enviada com sucesso.</p><p style="color:#92909a;font-size:12px">Você já pode usar este remetente para notificações, redefinição de senha e relatórios.</p></div>`});
}
