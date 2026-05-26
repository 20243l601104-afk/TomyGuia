import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { TomasaSVG } from './TomasaSVG';
import type { FixedExpenseSeed, FixedExpense } from '../types';
const IM: Record<FixedExpenseSeed['iconKey'], keyof typeof Ionicons.glyphMap> = {home:'home-outline',droplet:'water-outline',zap:'flash-outline',wifi:'wifi-outline',car:'car-outline',bus:'bus-outline',cart:'cart-outline',tv:'tv-outline'};
interface Props{seedExpenses?:FixedExpenseSeed[];onTotalsChange?:(t:{paid:number;total:number})=>void;onExpensesChange?:(e:FixedExpense[])=>void;}
export function CalendarWidget({seedExpenses,onTotalsChange,onExpensesChange}:Props){
  const [cd]=useState(new Date());
  const [sel,setSel]=useState<number|null>(null);
  const [pend,setPend]=useState<FixedExpense|null>(null);
  const ms=startOfMonth(cd),me=endOfMonth(ms),dim=eachDayOfInterval({start:ms,end:me}),sdi=getDay(ms);
  const mn=format(ms,'MMMM yyyy',{locale:es});
  const de:FixedExpense[]=seedExpenses&&seedExpenses.length>0?seedExpenses.map(s=>({id:s.id,title:s.title,color:s.color,amount:s.amount,day:null,isPaid:false,iconKey:s.iconKey})):[{id:'1',title:'Renta',color:'#F4ACB7',amount:800,day:null,isPaid:false,iconKey:'home' as const},{id:'2',title:'Agua',color:'#85A89E',amount:30,day:null,isPaid:false,iconKey:'droplet' as const},{id:'3',title:'Luz',color:'#F3C57C',amount:45,day:null,isPaid:false,iconKey:'zap' as const},{id:'4',title:'Internet',color:'#D977A0',amount:60,day:null,isPaid:false,iconKey:'wifi' as const}];
  const [exps,setExps]=useState<FixedExpense[]>(de);
  useEffect(()=>{
    if(onTotalsChange){const t=exps.reduce((a,e)=>a+e.amount,0),p=exps.filter(e=>e.isPaid).reduce((a,e)=>a+e.amount,0);onTotalsChange({paid:p,total:t});}
    if(onExpensesChange)onExpensesChange(exps);
  },[exps]);
  const una=exps.filter(e=>e.day===null),efd=(d:number)=>exps.filter(e=>e.day===d);
  const onDay=(d:number)=>{
    if(pend){setExps(p=>p.map(e=>e.id===pend.id?{...e,day:d}:e));setPend(null);setSel(null);}
    else setSel(d===sel?null:d);
  };
  const onExp=(e:FixedExpense)=>{
    if(e.day===null){setPend(e);}
    else Alert.alert(e.title,`$${e.amount.toLocaleString('es-MX')} · Día ${e.day}`,[{text:'✓ Pagado',onPress:()=>setExps(p=>p.map(x=>x.id===e.id?{...x,isPaid:!x.isPaid}:x))},{text:'Quitar',onPress:()=>setExps(p=>p.map(x=>x.id===e.id?{...x,day:null,isPaid:false}:x))},{text:'Cancelar',style:'cancel'}]);
  };
  return(
    <View style={s.c}>
      {una.length>0&&<View style={s.tr}>
        <View style={s.th}><TomasaSVG size={32}/><Text style={s.tt}>{pend?`Toca el día en que pagas "${pend.title}"`:'¡Acomoda tus gastos! Toca una burbuja luego un día. 🌸'}</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={s.ch}>
          {una.map(e=><TouchableOpacity key={e.id} style={[s.cp,{backgroundColor:e.color+(pend?.id===e.id?'FF':'33'),borderColor:e.color}]} onPress={()=>onExp(e)}>
            <Ionicons name={IM[e.iconKey]} size={14} color={pend?.id===e.id?'#fff':e.color}/>
            <Text style={[s.ct,{color:pend?.id===e.id?'#fff':e.color}]}>{e.title}</Text>
            <Text style={[s.ca,{color:pend?.id===e.id?'#ffffffCC':e.color+'CC'}]}>${e.amount.toLocaleString('es-MX')}</Text>
          </TouchableOpacity>)}
        </View></ScrollView>
      </View>}
      <Text style={s.mn}>{mn.charAt(0).toUpperCase()+mn.slice(1)}</Text>
      <View style={s.wr}>{['Do','Lu','Ma','Mi','Ju','Vi','Sá'].map(d=><Text key={d} style={s.wd}>{d}</Text>)}</View>
      <View style={s.gr}>
        {Array.from({length:sdi}).map((_,i)=><View key={`ph${i}`} style={s.dc}/>)}
        {dim.map(date=>{
          const d=date.getDate(),de2=efd(d),isSel=sel===d;
          return(
            <TouchableOpacity key={d} style={[s.dc,isSel&&s.dcs,!!pend&&s.dcp]} onPress={()=>onDay(d)}>
              <Text style={[s.dn,isSel&&s.dns]}>{d}</Text>
              {de2.map(e=><TouchableOpacity key={e.id} onPress={()=>onExp(e)}><View style={[s.ed,{backgroundColor:e.color,opacity:e.isPaid?.4:1}]}><Ionicons name={IM[e.iconKey]} size={8} color="#fff"/></View></TouchableOpacity>)}
            </TouchableOpacity>
          );
        })}
      </View>
      {exps.filter(e=>e.day!==null).length>0&&<View style={s.lg}>
        {exps.filter(e=>e.day!==null).map(e=><TouchableOpacity key={e.id} style={s.li} onPress={()=>onExp(e)}>
          <View style={[s.ld,{backgroundColor:e.color,opacity:e.isPaid?.4:1}]}/>
          <Text style={[s.ltit,e.isPaid&&s.lpd]}>{e.title}</Text>
          <Text style={s.ldy}>día {e.day}</Text>
          <Text style={s.lam}>${e.amount.toLocaleString('es-MX')}</Text>
          {e.isPaid&&<Ionicons name="checkmark-circle" size={14} color="#85A89E"/>}
        </TouchableOpacity>)}
      </View>}
    </View>
  );
}
const s=StyleSheet.create({
  c:{gap:12},tr:{backgroundColor:'rgba(255,255,255,0.7)',borderRadius:20,padding:12,gap:10},
  th:{flexDirection:'row',alignItems:'flex-start',gap:8},tt:{flex:1,fontSize:11,color:'#9D8189',lineHeight:16},
  ch:{flexDirection:'row',gap:8,paddingVertical:4},
  cp:{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:10,paddingVertical:6,borderRadius:99,borderWidth:1.5},
  ct:{fontSize:11,fontWeight:'700'},ca:{fontSize:10,fontWeight:'600'},
  mn:{fontSize:15,fontWeight:'800',color:'#9D8189',textAlign:'center'},
  wr:{flexDirection:'row',justifyContent:'space-around'},wd:{width:40,textAlign:'center',fontSize:10,fontWeight:'700',color:'#9D8189',opacity:0.5},
  gr:{flexDirection:'row',flexWrap:'wrap'},
  dc:{width:'14.28%',aspectRatio:0.7,alignItems:'center',paddingTop:4,gap:2,borderRadius:12},
  dcs:{backgroundColor:'#F4ACB744'},dcp:{backgroundColor:'#D8E2DC44'},
  dn:{fontSize:12,fontWeight:'600',color:'#9D8189'},dns:{color:'#F4ACB7',fontWeight:'800'},
  ed:{width:16,height:16,borderRadius:8,alignItems:'center',justifyContent:'center'},
  lg:{gap:6},li:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'rgba(255,255,255,0.6)',borderRadius:12,padding:10},
  ld:{width:8,height:8,borderRadius:4},ltit:{flex:1,fontSize:12,fontWeight:'700',color:'#9D8189'},
  lpd:{textDecorationLine:'line-through',opacity:0.5},ldy:{fontSize:11,color:'#9D8189',opacity:0.6},lam:{fontSize:12,fontWeight:'700',color:'#9D8189'},
});
