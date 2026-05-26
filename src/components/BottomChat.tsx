import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, NEEDS_KEYWORDS, WANTS_KEYWORDS } from '../constants';
import { IncomeAllocationModal } from './IncomeModal';
import type { Allocation } from '../types';
interface Props{onIncomeAdded?:(amount:number,allocation:Allocation)=>void;onExpenseAdded?:(amount:number,category:'needs'|'wants',label:string)=>void;currentNeeds:number;currentWants:number;currentSavings:number;totalBalance:number;}
function cat(msg:string):'needs'|'wants'{const m=msg.toLowerCase();if(NEEDS_KEYWORDS.some(k=>m.includes(k)))return'needs';if(WANTS_KEYWORDS.some(k=>m.includes(k)))return'wants';return'wants';}
const CHIPS=[{label:'+ $5000 Sueldo',type:'income'},{label:'- $80 Café',type:'expense'},{label:'- $150 Transporte',type:'expense'},{label:'+ $100 Venta',type:'income'}];
export function BottomChat({onIncomeAdded,onExpenseAdded,currentNeeds,currentWants,currentSavings,totalBalance}:Props){
  const [text,setText]=useState('');
  const [isFocused,setIsFocused]=useState(false);
  const [isTyping,setIsTyping]=useState(false);
  const [showModal,setShowModal]=useState(false);
  const [incomeAmount,setIncomeAmount]=useState(0);
  const inputRef=useRef<TextInput>(null);
  const handleSend=()=>{
    if(!text.trim())return;
    const msg=text.trim();setText('');setIsFocused(false);setIsTyping(true);
    setTimeout(()=>{
      setIsTyping(false);
      const lower=msg.toLowerCase(),match=msg.match(/\d+/);if(!match)return;
      const amount=parseInt(match[0],10);
      const isIncome=lower.includes('recibí')||lower.includes('recibi')||lower.includes('sueldo')||lower.includes('ingreso')||lower.includes('cobré')||lower.includes('me pagaron')||msg.startsWith('+');
      if(isIncome){setIncomeAmount(amount);setShowModal(true);return;}
      const isExpense=msg.startsWith('-')||lower.includes('gasté')||lower.includes('gaste')||lower.includes('pagué')||lower.includes('pague')||lower.includes('compré')||lower.includes('compre');
      if(isExpense&&onExpenseAdded)onExpenseAdded(amount,cat(msg),msg);
    },1200);
  };
  return(
    <View style={s.w}>
      <IncomeAllocationModal isOpen={showModal} onClose={()=>setShowModal(false)} amount={incomeAmount} onConfirm={(alloc)=>onIncomeAdded?.(incomeAmount,alloc)} currentNeeds={currentNeeds} currentWants={currentWants} currentSavings={currentSavings} totalBalance={totalBalance}/>
      {isTyping&&<View style={s.ty}><View style={s.ds}><View style={[s.d,{backgroundColor:COLORS.ROSA}]}/><View style={[s.d,{backgroundColor:COLORS.ROSA_CLARO}]}/><View style={[s.d,{backgroundColor:COLORS.MENTA}]}/></View><Text style={s.tt}>Tomasa está calculando...</Text></View>}
      {isFocused&&<ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.cs} contentContainerStyle={s.cc} keyboardShouldPersistTaps="always">
        {CHIPS.map((c,i)=><TouchableOpacity key={i} style={[s.cp,c.type==='income'?s.ci:s.ce]} onPress={()=>{setText(c.label);inputRef.current?.focus();}}><Text style={c.type==='income'?s.cit:s.cet}>{c.label}</Text></TouchableOpacity>)}
      </ScrollView>}
      <View style={s.b}>
        <TouchableOpacity style={s.m}><Ionicons name="mic-outline" size={20} color={COLORS.ROSA}/></TouchableOpacity>
        <TextInput ref={inputRef} style={s.i} value={text} onChangeText={setText} onFocus={()=>setIsFocused(true)} onBlur={()=>setIsFocused(false)} onSubmitEditing={handleSend} placeholder="Ej. Recibí $5000..." placeholderTextColor={COLORS.MALVA+'80'} returnKeyType="send"/>
        <TouchableOpacity style={[s.s,!text.trim()&&{opacity:0.3}]} onPress={handleSend} disabled={!text.trim()}><Ionicons name="send" size={20} color={COLORS.ROSA}/></TouchableOpacity>
      </View>
    </View>
  );
}
const s=StyleSheet.create({
  w:{gap:0},ty:{marginHorizontal:16,marginBottom:8,backgroundColor:'rgba(255,255,255,0.9)',borderRadius:16,padding:12,gap:8,elevation:3},
  ds:{flexDirection:'row',gap:6},d:{width:8,height:8,borderRadius:4},tt:{fontSize:12,fontWeight:'600',color:'#9D8189'},
  cs:{maxHeight:44},cc:{paddingHorizontal:16,gap:8,paddingBottom:8,alignItems:'center'},
  cp:{paddingHorizontal:16,paddingVertical:8,borderRadius:99,borderWidth:1},ci:{backgroundColor:'#FFCAD444',borderColor:'#FFCAD4'},ce:{backgroundColor:'rgba(255,255,255,0.6)',borderColor:'#fff'},
  cit:{fontSize:12,fontWeight:'700',color:'#F4ACB7'},cet:{fontSize:12,fontWeight:'700',color:'#9D8189'},
  b:{flexDirection:'row',alignItems:'center',backgroundColor:'rgba(255,255,255,0.7)',borderTopWidth:1,borderTopColor:'rgba(255,255,255,0.8)',paddingHorizontal:16,paddingVertical:12,gap:12},
  m:{padding:4},i:{flex:1,fontSize:14,fontWeight:'500',color:'#9D8189',backgroundColor:'#fff',borderRadius:99,paddingHorizontal:16,paddingVertical:10,elevation:2},s:{padding:4},
});
