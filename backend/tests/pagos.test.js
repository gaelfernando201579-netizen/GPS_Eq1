import test from 'node:test';
import assert from 'node:assert/strict';
import {verificarCep} from '../src/services/banxicoCepService.js';
import {analizarComprobante} from '../src/services/aiReceiptService.js';
test('CEP sin integración autorizada no confirma',async()=>{const r=await verificarCep();assert.equal(r.confirmado,false);assert.equal(r.disponible,false);});
test('IA sin credenciales no inventa análisis',async()=>{const key=process.env.OPENAI_API_KEY,model=process.env.OPENAI_RECEIPT_MODEL;delete process.env.OPENAI_API_KEY;delete process.env.OPENAI_RECEIPT_MODEL;try{const r=await analizarComprobante(Buffer.from(''), 'image/png');assert.equal(r.configurado,false);assert.equal(r.datos,null);}finally{if(key)process.env.OPENAI_API_KEY=key;if(model)process.env.OPENAI_RECEIPT_MODEL=model;}});
