// Validate our own small ZIP artifacts before upload (ZIP64/encrypted files unsupported).
import assert from 'node:assert/strict';
import {inflateRawSync} from 'node:zlib';
import CRC32 from 'crc-32';
export function validateZip(bytes){
 let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(bytes.readUInt32LE(i)===0x06054b50&&i+22+bytes.readUInt16LE(i+20)===bytes.length){end=i;break;}
 assert(end>=0,'Incomplete ZIP: missing end record');
 assert.equal(bytes.readUInt32LE(end+4),0,'Multi-disk ZIP unsupported');
 const count=bytes.readUInt16LE(end+10),size=bytes.readUInt32LE(end+12),offset=bytes.readUInt32LE(end+16);
 assert.equal(bytes.readUInt16LE(end+8),count);assert(count>0&&count<65535);assert.equal(offset+size,end);
 let at=offset;const names=new Set();
 for(let n=0;n<count;n++){
  assert(at+46<=end);assert.equal(bytes.readUInt32LE(at),0x02014b50);
  const flags=bytes.readUInt16LE(at+8),method=bytes.readUInt16LE(at+10),crc=bytes.readUInt32LE(at+16),packed=bytes.readUInt32LE(at+20),length=bytes.readUInt32LE(at+24),nameLength=bytes.readUInt16LE(at+28),extra=bytes.readUInt16LE(at+30),comment=bytes.readUInt16LE(at+32),local=bytes.readUInt32LE(at+42);
  assert.equal(flags&1,0,'Encrypted ZIP unsupported');assert([0,8].includes(method));assert(length<64*1024*1024);
  const name=bytes.subarray(at+46,at+46+nameLength).toString('utf8');assert(name&&!name.startsWith('/')&&!name.split('/').includes('..')&&!names.has(name));names.add(name);
  assert(local+30<=offset);assert.equal(bytes.readUInt32LE(local),0x04034b50);
  const start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28);assert(start+packed<=offset);
  const data=bytes.subarray(start,start+packed),plain=method===8?inflateRawSync(data,{maxOutputLength:64*1024*1024}):data;
  assert.equal(plain.length,length);assert.equal(CRC32.buf(plain)>>>0,crc,'ZIP entry checksum mismatch');
  at+=46+nameLength+extra+comment;
 }
 assert.equal(at,end);return names;
}
