import {Transaction} from '@mysten/sui/transactions';
import {verifyTransactionSignature} from '@mysten/sui/verify';
import {fromBase64,normalizeStructTag} from '@mysten/sui/utils';
import {bcs} from '@mysten/sui/bcs';
import {SuiGraphQLClient} from '@mysten/sui/graphql';
import {TREE_TYPE,treeAmount} from './tree.mjs';
import {TREE_PAYMENT_RECIPIENT} from './config.mjs';
import {addressOf} from '../ownership.mjs';
const signatureClient=new SuiGraphQLClient({network:'mainnet',url:'https://graphql.mainnet.sui.io/graphql'});
const index=a=>a?.$kind==='Input'?a.Input:-1;
export function createSignedInspector(client){
 if(client?.network!=='mainnet'||!client.getObjects)throw Error('Mainnet object reader required');
 return async(signed,invoice)=>{
  if(typeof signed?.bytes!=='string'||signed.bytes.length>64000||!/^[A-Za-z0-9+/]+={0,2}$/.test(signed.bytes)||typeof signed.signature!=='string'||signed.signature.length>8000)throw Error('Invalid signed transaction');
  const bytes=fromBase64(signed.bytes),tx=Transaction.from(bytes),d=tx.getData();
  if(addressOf(d.sender)!==invoice.wallet||invoice.recipient!==TREE_PAYMENT_RECIPIENT||invoice.network!=='mainnet'||invoice.amount!==treeAmount(invoice.product,invoice.decimals))throw Error('Payment invoice mismatch');
  if(addressOf(d.gasData.owner)!==invoice.wallet||!d.gasData.payment?.length||BigInt(d.gasData.budget??0)<=0n||BigInt(d.gasData.budget)>50000000n)throw Error('Unexpected gas owner or budget');
  const commands=d.commands;let merge=null,splitAt=0;
  if(commands[0]?.$kind==='MergeCoins'){merge=commands[0].MergeCoins;splitAt=1;}
  if(commands.length!==splitAt+2||commands[splitAt]?.$kind!=='SplitCoins'||commands.at(-1)?.$kind!=='TransferObjects')throw Error('Only the reviewed TREE transfer is allowed');
  const split=commands[splitAt].SplitCoins,transfer=commands.at(-1).TransferObjects;
  const main=index(split.coin),amount=index(split.amounts?.[0]),recipient=index(transfer.address);
  const objects=[main,...(merge?.sources?.map(index)??[])];
  if(main<0||split.amounts.length!==1||amount<0||recipient<0||amount===recipient||new Set(objects).size!==objects.length||objects.some(i=>i<0)||d.inputs.length!==objects.length+2||(merge&&index(merge.destination)!==main))throw Error('Unexpected payment inputs');
  if(transfer.objects.length!==1||transfer.objects[0].$kind!=='NestedResult'||transfer.objects[0].NestedResult[0]!==splitAt||transfer.objects[0].NestedResult[1]!==0)throw Error('Unexpected transfer object');
  const amountBytes=d.inputs[amount]?.Pure?.bytes,recipientBytes=d.inputs[recipient]?.Pure?.bytes;
  if(!amountBytes||!recipientBytes||bcs.u64().parse(fromBase64(amountBytes))!==invoice.amount||addressOf(bcs.Address.parse(fromBase64(recipientBytes)))!==invoice.recipient)throw Error('Wrong TREE amount or recipient');
  const refs=objects.map(i=>d.inputs[i]?.Object?.ImmOrOwnedObject);
  if(refs.some(r=>!r)||refs.length>100)throw Error('Invalid TREE coin inputs');
  const gas=d.gasData.payment,all=[...refs,...gas];if(new Set(all.map(r=>r.objectId)).size!==all.length)throw Error('Duplicate coin input');
  await verifyTransactionSignature(bytes,signed.signature,{address:invoice.wallet,client:signatureClient});
  const response=await client.getObjects({objectIds:all.map(r=>r.objectId),signal:AbortSignal.timeout(20000)});
  if(response.objects.length!==all.length)throw Error('Incomplete coin data');
  for(let i=0;i<all.length;i++){
   const o=response.objects[i],ref=all[i],type=i<refs.length?`0x2::coin::Coin<${TREE_TYPE}>`:'0x2::coin::Coin<0x2::sui::SUI>';
   if(o instanceof Error||o.objectId!==ref.objectId||o.version!==ref.version||o.digest!==ref.digest||o.owner?.$kind!=='AddressOwner'||addressOf(o.owner.AddressOwner)!==invoice.wallet||normalizeStructTag(o.type)!==normalizeStructTag(type))throw Error('Coin type, version or ownership changed');
  }
  return tx.getDigest();
 };
}
