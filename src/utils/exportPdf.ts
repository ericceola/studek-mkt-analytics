const nextFrame=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));

export async function exportElementToLandscapePdf(selector:string,filename:string){
  const element=document.querySelector<HTMLElement>(selector);if(!element)throw new Error('Conteúdo do relatório não encontrado.');
  element.classList.add('pdf-exporting');
  try{
    await document.fonts?.ready;await nextFrame();
    const [{default:html2canvas},{jsPDF}]=await Promise.all([import('html2canvas'),import('jspdf')]);
    const contentHeight=element.scrollHeight;const scale=Math.max(1,Math.min(2,28000/Math.max(1,contentHeight)));
    const canvas=await html2canvas(element,{scale,useCORS:true,allowTaint:false,logging:false,backgroundColor:'#ffffff',width:element.scrollWidth,height:contentHeight,windowWidth:Math.max(document.documentElement.clientWidth,element.scrollWidth),scrollX:0,scrollY:-window.scrollY,ignoreElements:node=>node instanceof HTMLElement&&Boolean(node.closest('[data-pdf-ignore]'))});
    const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
    const pageWidth=297,pageHeight=210,margin=8,usableWidth=pageWidth-margin*2,usableHeight=pageHeight-margin*2;
    const sliceHeight=Math.max(1,Math.floor(canvas.width*usableHeight/usableWidth));let offset=0,page=0;
    while(offset<canvas.height){const height=Math.min(sliceHeight,canvas.height-offset);const slice=document.createElement('canvas');slice.width=canvas.width;slice.height=height;const context=slice.getContext('2d');if(!context)throw new Error('Não foi possível preparar o PDF.');context.fillStyle='#fff';context.fillRect(0,0,slice.width,slice.height);context.drawImage(canvas,0,offset,canvas.width,height,0,0,canvas.width,height);if(page)pdf.addPage('a4','landscape');const renderedHeight=height/canvas.width*usableWidth;pdf.addImage(slice.toDataURL('image/jpeg',0.94),'JPEG',margin,margin,usableWidth,renderedHeight,undefined,'FAST');pdf.setFontSize(8);pdf.setTextColor(125);pdf.text(`${page+1}`,pageWidth-margin,pageHeight-3,{align:'right'});offset+=height;page++}
    pdf.setProperties({title:filename.replace(/\.pdf$/i,''),subject:'Relatório Studek Analytics'});pdf.save(filename.endsWith('.pdf')?filename:`${filename}.pdf`);
  }finally{element.classList.remove('pdf-exporting')}
}
