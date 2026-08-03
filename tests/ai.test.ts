import {describe,expect,it} from 'vitest';
import {decryptSecret,encryptSecret} from '../server/services/ai.js';

describe('credenciais de inteligência artificial',()=>{
  it('criptografa a chave sem armazenar o valor original',()=>{
    const encrypted=encryptSecret('sk-chave-de-teste','segredo-da-plataforma');
    expect(encrypted).not.toContain('sk-chave-de-teste');
    expect(decryptSecret(encrypted,'segredo-da-plataforma')).toBe('sk-chave-de-teste');
  });
  it('não descriptografa com outro segredo',()=>{
    const encrypted=encryptSecret('chave','segredo-correto');
    expect(()=>decryptSecret(encrypted,'segredo-incorreto')).toThrow();
  });
});
