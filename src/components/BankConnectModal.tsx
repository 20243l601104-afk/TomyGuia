import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ConnectedBank, BankTransaction } from '../types';
const BANKS=[{id:'bbva',name:'BBVA',color:'#004481',emoji:'💙'},{id:'banamex',name:'Citibanamex',color:'#E60012',emoji:'❤️'},{id:'santander',name:'Santander',color:'#EC0000',emoji:'🟥'},{id:'banorte',name:'Banorte',color:'#EB0029',emoji:'🟢'},{id:'nu',name:'Nu',color:'#820AD1',emoji:'💜'}];
const TXS=[{amount:1240,category:'needs' as const,label:'Supermercado Soriana',source:'card' as const},{amount:380,category:'needs' as const,label:'Gasolinera Pemex',source:'card' as const},{amount:250,category:'wants' as const,label:'Starbucks',source:'card' as const},{amount:480,category:'wants' as const,label:'Cinépolis VIP',source:'card' as const},{amount:199,category:'wants' as const,label:'Spotify Premium',source:'card' as const}];
interface Props{isOpen:boolean;onClose:()=>void;onConnected:(bank:ConnectedBank,txs:BankTransaction[])=>void;}
export function BankConnectModal({isOpen,onClose,onConnected}:Props){
  const [sel,setSel]=useState<typeof BANKS[0]|null>(null);
  const [step,setStep]=useState<'select'|'confirm'|'loading'|'done'>('select');
  const connect=()=>{
    if(!sel)return;setStep('loading');
    setTimeout(()=>{
      const bank:ConnectedBank={id:sel.id,name:sel.name,color:sel.color,last4:'4242',connectedAt:Date.now()};
      const txs:BankTransaction[]=TXS.map((t,i)=>({...t,id:i+1}));
      setStep('done');setTimeout(()=>{onConnected(bank,txs);onClose();setStep('select');setSel(null);},1500);
    },2500);
  };
  return(
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.ov} activeOpacity={1} onPress={onClose}/>
      <View style={s.sh}>
        <View style={s.hd}/>
        {step==='select'&&<>
          <Text style={s.ti}>Conecta tu banco 🏦</Text>
          <Text style={s.su}>Tus movimientos se categorizan con 50/30/20</Text>
          <ScrollView style={{maxHeight:300}}>
            {BANKS.map(b=><TouchableOpacity key={b.id} style={[s.bb,sel?.id===b.id&&s.bbs]} onPress={()=>setSel(b)}>
              <Text style={s.be}>{b.emoji}</Text><Text style={[s.bn,sel?.id===b.id&&{color:'#fff'}]}>{b.name}</Text>
              {sel?.id===b.id&&<Ionicons name="checkmark-circle" size={20} color="#fff"/>}
            </TouchableOpacity>)}
          </ScrollView>
          <TouchableOpacity style={[s.cb,!sel&&s.cd]} disabled={!sel} onPress={()=>setStep('confirm')}><Text style={s.ct}>Continuar</Text><Ionicons name="arrow-forward" size={18} color="#fff"/></TouchableOpacity>
        </>}
        {step==='confirm'&&sel&&<>
          <Text style={s.ti}>Confirmar conexión</Text>
          <View style={s.bp}><Text style={s.be}>{BANKS.find(b=>b.id===sel.id)?.emoji}</Text><Text style={[s.bn,{color:sel.color,fontSize:18}]}>{sel.name}</Text></View>
          <Text style={s.cd2}>Importaremos tus últimos movimientos y los categorizaremos automáticamente.</Text>
          <TouchableOpacity style={s.cb} onPress={connect}><Ionicons name="shield-checkmark-outline" size={18} color="#fff"/><Text style={s.ct}>Conectar</Text></TouchableOpacity>
          <TouchableOpacity style={s.bk} onPress={()=>setStep('select')}><Text style={s.bkt}>Cambiar banco</Text></TouchableOpacity>
        </>}
        {step==='loading'&&<View style={s.lc}><ActivityIndicator size="large" color="#F4ACB7"/><Text style={s.lt}>Conectando con {sel?.name}...</Text></View>}
        {step==='done'&&<View style={s.lc}><View style={s.dc}><Ionicons name="checkmark" size={36} color="#fff"/></View><Text style={s.lt}>¡Cuenta conectada!</Text></View>}
      </View>
    </Modal>
  );
}
const s=StyleSheet.create({
  ov:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.4)'},sh:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:'rgba(255,255,255,0.98)',borderTopLeftRadius:32,borderTopRightRadius:32,padding:24,paddingBottom:40,elevation:20},
  hd:{width:48,height:5,backgroundColor:'#D8E2DC',borderRadius:99,alignSelf:'center',marginBottom:16},ti:{fontSize:22,fontWeight:'800',color:'#F4ACB7',textAlign:'center',marginBottom:4},su:{fontSize:13,color:'#9D8189',textAlign:'center',opacity:0.7,marginBottom:16},
  bb:{flexDirection:'row',alignItems:'center',gap:12,padding:14,borderRadius:16,backgroundColor:'rgba(255,255,255,0.7)',marginBottom:8,borderWidth:2,borderColor:'transparent'},bbs:{backgroundColor:'#F4ACB7',borderColor:'#F4ACB7'},
  be:{fontSize:24},bn:{flex:1,fontSize:15,fontWeight:'700',color:'#9D8189'},
  cb:{backgroundColor:'#F4ACB7',borderRadius:16,paddingVertical:16,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginTop:12,elevation:6},cd:{backgroundColor:'#FFE5D9',elevation:0},ct:{color:'#fff',fontWeight:'700',fontSize:16},
  bp:{alignItems:'center',gap:8,padding:24},cd2:{fontSize:13,color:'#9D8189',textAlign:'center',lineHeight:20,marginBottom:16},
  bk:{alignItems:'center',paddingVertical:12},bkt:{fontSize:13,fontWeight:'600',color:'#9D8189'},
  lc:{alignItems:'center',justifyContent:'center',paddingVertical:40,gap:16},lt:{fontSize:18,fontWeight:'800',color:'#F4ACB7'},dc:{width:72,height:72,borderRadius:36,backgroundColor:'#85A89E',alignItems:'center',justifyContent:'center'},
});
