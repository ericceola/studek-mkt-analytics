import {describe,expect,it} from 'vitest';
import {engagement,normalizePost,normalizeUsername} from '../server/services/normalizer.js';

describe('normalização do Instagram',()=>{
  it('normaliza username, URL e arroba',()=>{
    expect(normalizeUsername('@Studek.Oficial')).toBe('studek.oficial');
    expect(normalizeUsername('https://www.instagram.com/Studek.Oficial/')).toBe('studek.oficial');
  });
  it('usa visualizações quando reproduções não existem',()=>{
    const post=normalizePost({id:'1',type:'Video',caption:'Teste #Educação #ENEM',likesCount:10,commentsCount:2,videoViewCount:100});
    expect(post.plays).toBe(100); expect(post.hashtags).toEqual(['educação','enem']); expect(post.type).toBe('Video');
  });
  it('reconhece campos atuais de reels e parcerias da Apify',()=>{
    const post=normalizePost({type:'Video',productType:'clips',paidPartnership:true,isCommentsDisabled:true});
    expect(post.type).toBe('Reel'); expect(post.surface).toBe('Reel'); expect(post.paid).toBe(true); expect(post.commentsDisabled).toBe(true);
  });
  it('identifica stories pela URL de origem',()=>{expect(normalizePost({type:'Video',inputUrl:'https://www.instagram.com/stories/perfil/'}).surface).toBe('Story')});
  it('calcula engajamento com segurança',()=>{
    expect(engagement(80,20,1000)).toEqual({count:100,rate:10});
    expect(engagement(10,2,0)).toEqual({count:12,rate:0});
  });
});
