import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarWidget } from '../components/CalendarWidget';
import { BottomChat } from '../components/BottomChat';
import { BankConnectModal } from '../components/BankConnectModal';
import type { FixedExpenseSeed, FixedExpense, Expense, ConnectedBank, BankTransaction } from '../types';
interface Props{emergencyFundGoal:number;totalBalance:number;seedExpenses:FixedExpenseSeed[];monthlyIncome:number;}
export function DashboardScreen({emergencyFundGoal,totalBalance,seedExpenses,monthlyIncome}:Props){
  const ins=useSafeAreaInsets();
  const me=emergencyFundGoal>0?emergencyFundGoal/3:0;
  const [ef,setEf]=useState(0);
  const ep=emergencyFundGoal>0?Math.min((ef/emergencyFundGoal)*100,100):0;
  const mp=me>0?(ef/me).toFixed(1):'0';
  const [bal,setBal]=useState(totalBalance);
  const av=Math.max(0,bal-ef);
  const wb=monthlyIncome*.3,wf=Math.round(wb/4),df=Math.floor(wb/30);
  const tl=new Date().toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'});
  const [ne,setNe]=useState(false);
  const [nt,setNt]=useState({paid:0,total:0});
  const [fel,setFel]=useState<FixedExpense[]>([]);
  const onTot=useCallback((t:{paid:number;total:number})=>setNt(t),[]);
  const onExp=useCallback((l:FixedExpense[])=>setFel(l),[]);
  const ft=nt.total>0?nt.total:me,np=ft>0?Math.min((nt.paid/ft)*100,100):0;
  const [exps,setExps]=useState<Expense[]>([]);
  const [bmo,setBmo]=useState(false);
  const [cb,setCb]=useState<ConnectedBank|null>(null);
  const onBC=useCallback((bank:ConnectedBank,txs:BankTransaction[])=>{setCb(bank);setExps(p=>[...p,...txs]);const im=txs.reduce((a,b)=>a+b.amount,0);setBal(p=>Math.max(0,p-im));},[]);
  const onEA=(amt:number,cat:'needs'|'wants',lbl:string)=>{setExps(p=>[...p,{id:Date.now(),amount:amt,category:cat,label:lbl,source:'chat'}]);setBal(p=>Math.max(0,p-amt));};
  const onIA=(amt:number,al:{needs:number;wants:number;savings:number})=>{setBal(p=>p+amt);const r=al.needs+al.savings;if(r>0)setEf(p=>p+r);};
  const fr=(ts:number)=>{const d=Math.floor((Date.now()-ts)/60000);if(d<1)return'ahora';if(d<60)return`hace ${d} min`;const h=Math.floor(d/60);if(h<24)return`hace ${h} h`;return`hace ${Math.floor(h/24)} d`;};
  return(
    <View style={[s.con,{paddingTop:ins.top}]}>
      <View style={[s.bl,s.b1]}/><View style={[s.bl,s.b2]}/>
      <View style={s.hd}>
        <View><Text style={s.gr}>¡Hola, Vane!</Text><Text style={s.sg}>Lista para crecer</Text></View>
        <View style={s.av}><Image source={{uri:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop'}} style={s.ai}/></View>
      </View>
      <ScrollView style={s.sc} contentContainerStyle={{paddingBottom:140}} showsVerticalScrollIndicator={false}>
        <View style={s.cd}>
          <View style={s.ch}><View style={s.ib}><Ionicons name="sunny-outline" size={14} color="#F4ACB7"/></View><Text style={s.cl}>DINERO LIBRE PARA HOY</Text><View style={s.tg}><Text style={s.tt}>30% semanal</Text></View></View>
          <View style={s.bc}><Text style={s.bcu}>$</Text><Text style={s.bam}>{df.toLocaleString('es-MX')}</Text></View>
          <Text style={s.bs}>{tl} · ${wf.toLocaleString('es-MX')} semana</Text>
        </View>
        {!cb?(
          <TouchableOpacity style={s.bb} onPress={()=>setBmo(true)} activeOpacity={0.8}>
            <View style={[s.ib,{backgroundColor:'#FFCAD440',marginRight:12}]}><Ionicons name="add" size={18} color="#F4ACB7"/></View>
            <View style={{flex:1}}><Text style={s.bnt}>Conectar cuenta bancaria</Text><Text style={s.bst}>Registra y categoriza tus gastos automáticamente</Text></View>
            <Ionicons name="business-outline" size={18} color="#F4ACB7AA"/>
          </TouchableOpacity>
        ):(
          <View style={[s.bcc,{backgroundColor:cb.color}]}>
            <View style={s.bcr}><Ionicons name="business-outline" size={14} color="#fff"/><Text style={s.bcl}>Cuenta conectada</Text><TouchableOpacity onPress={()=>setCb({...cb,connectedAt:Date.now()})} style={s.rs}><Ionicons name="refresh-outline" size={11} color="#fff"/><Text style={s.rt}>Sincronizar</Text></TouchableOpacity></View>
            <Text style={s.bnn}>{cb.name}</Text><Text style={s.bl4}>•••• {cb.last4} · {fr(cb.connectedAt)}</Text>
          </View>
        )}
        <View style={s.nc}>
          <View style={s.nh}><View style={s.nt2}><Ionicons name="receipt-outline" size={16} color="#F4ACB7"/><Text style={s.ntx}>Necesidades</Text></View><View style={s.tg}><Text style={s.tt}>{np.toFixed(0)}% cubierto</Text></View></View>
          <View style={s.na}><Text style={s.nab}>${nt.paid.toLocaleString('es-MX')}</Text><Text style={s.nas}>/ ${ft.toLocaleString('es-MX')} este mes</Text></View>
          <View style={s.pt}><View style={[s.pf,{width:`${np}%` as any,backgroundColor:'#F4ACB7'}]}/></View>
          <TouchableOpacity style={s.ct} onPress={()=>setNe(!ne)}><Ionicons name="calendar-outline" size={14} color="#F4ACB7"/><Text style={s.ctt}>Ver calendario de pagos</Text><Ionicons name={ne?'chevron-up':'chevron-down'} size={16} color="#F4ACB7"/></TouchableOpacity>
          {ne&&<View style={{marginTop:16}}><CalendarWidget seedExpenses={seedExpenses} onTotalsChange={onTot} onExpensesChange={onExp}/></View>}
        </View>
        <View style={s.fc}>
          <View style={s.nh}><View style={s.nt2}><Ionicons name="shield-checkmark-outline" size={16} color="#85A89E"/><Text style={[s.ntx,{color:'#5B776F'}]}>Futuro</Text></View><View style={[s.tg,{backgroundColor:'#85A89E20'}]}><Text style={[s.tt,{color:'#5B776F'}]}>{ep.toFixed(0)}% cubierto</Text></View></View>
          <View style={s.na}><Text style={[s.nab,{color:'#5B776F'}]}>${ef.toLocaleString('es-MX')}</Text><Text style={s.nas}>/ ${emergencyFundGoal.toLocaleString('es-MX')} · 3 meses</Text></View>
          <View style={s.pt}><View style={[s.pf,{width:`${ep}%` as any,backgroundColor:'#85A89E'}]}/></View>
          <Text style={s.fp}>🛡️ {mp} meses de seguridad asegurados</Text>
        </View>
      </ScrollView>
      <View style={s.cbr}><BottomChat onIncomeAdded={onIA} onExpenseAdded={onEA} currentNeeds={ef} currentWants={av} currentSavings={0} totalBalance={bal}/></View>
      <BankConnectModal isOpen={bmo} onClose={()=>setBmo(false)} onConnected={onBC}/>
    </View>
  );
}
const s=StyleSheet.create({
  con:{flex:1,backgroundColor:'#FFE5D9'},bl:{position:'absolute',borderRadius:999},b1:{top:'-10%',right:'-10%',width:256,height:256,backgroundColor:'#F4ACB730'},b2:{bottom:'20%',left:'-20%',width:320,height:320,backgroundColor:'#D8E2DC40'},
  hd:{paddingTop:12,paddingHorizontal:24,paddingBottom:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between',zIndex:10},gr:{fontSize:24,fontWeight:'800',color:'#F4ACB7'},sg:{fontSize:13,color:'#9D8189',opacity:0.8},av:{width:48,height:48,borderRadius:24,borderWidth:3,borderColor:'rgba(255,255,255,0.6)',overflow:'hidden',backgroundColor:'#fff'},ai:{width:'100%',height:'100%'},
  sc:{flex:1,paddingHorizontal:24,paddingTop:8,zIndex:10},
  cd:{backgroundColor:'rgba(255,255,255,0.6)',borderRadius:28,padding:20,marginBottom:16,borderWidth:1,borderColor:'rgba(255,255,255,0.8)'},ch:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12},ib:{width:28,height:28,borderRadius:14,backgroundColor:'#FFCAD440',alignItems:'center',justifyContent:'center'},cl:{flex:1,fontSize:10,fontWeight:'800',letterSpacing:1.5,color:'#9D8189',opacity:0.7,textTransform:'uppercase'},tg:{backgroundColor:'#F4ACB7',paddingHorizontal:10,paddingVertical:3,borderRadius:99},tt:{fontSize:9,fontWeight:'800',color:'#fff',textTransform:'uppercase'},bc:{flexDirection:'row',alignItems:'flex-end',justifyContent:'center',gap:4,marginBottom:6},bcu:{fontSize:20,fontWeight:'500',color:'#F4ACB7',opacity:0.6,paddingBottom:6},bam:{fontSize:52,fontWeight:'900',color:'#F4ACB7'},bs:{fontSize:11,color:'#9D8189',opacity:0.6,textAlign:'center',textTransform:'capitalize'},
  bb:{backgroundColor:'rgba(255,255,255,0.6)',borderRadius:24,padding:16,flexDirection:'row',alignItems:'center',marginBottom:16,borderWidth:1.5,borderColor:'#F4ACB760',borderStyle:'dashed'},bnt:{fontSize:14,fontWeight:'700',color:'#F4ACB7'},bst:{fontSize:11,color:'#9D8189',opacity:0.7},
  bcc:{borderRadius:24,padding:16,marginBottom:16},bcr:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8},bcl:{flex:1,fontSize:10,fontWeight:'800',color:'#fff',opacity:0.8,textTransform:'uppercase',letterSpacing:1},rs:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'rgba(255,255,255,0.2)',paddingHorizontal:10,paddingVertical:4,borderRadius:99},rt:{fontSize:10,fontWeight:'700',color:'#fff'},bnn:{fontSize:18,fontWeight:'800',color:'#fff'},bl4:{fontSize:11,color:'#fff',opacity:0.8},
  nc:{backgroundColor:'rgba(255,255,255,0.4)',borderRadius:28,padding:20,marginBottom:16,borderWidth:1,borderColor:'rgba(255,255,255,0.5)'},nh:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8},nt2:{flexDirection:'row',alignItems:'center',gap:8},ntx:{fontSize:14,fontWeight:'700',color:'#9D8189'},na:{flexDirection:'row',alignItems:'baseline',gap:8,marginBottom:12},nab:{fontSize:24,fontWeight:'800',color:'#F4ACB7'},nas:{fontSize:12,fontWeight:'600',color:'#9D8189',opacity:0.6},pt:{height:10,backgroundColor:'rgba(255,255,255,0.5)',borderRadius:99,overflow:'hidden',marginBottom:12},pf:{height:'100%',borderRadius:99},
  ct:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'rgba(255,255,255,0.6)',borderRadius:16,padding:12,borderWidth:1,borderColor:'rgba(255,255,255,0.8)'},ctt:{flex:1,fontSize:12,fontWeight:'700',color:'#9D8189'},
  fc:{backgroundColor:'#D8E2DC40',borderRadius:28,padding:20,marginBottom:16,borderWidth:1,borderColor:'rgba(255,255,255,0.8)'},fp:{fontSize:11,color:'#74928A',opacity:0.8,marginTop:8},
  cbr:{position:'absolute',bottom:0,left:0,right:0,zIndex:40},
});
