
function iosNativeType(t){
 t=String(t||"sine").toLowerCase();
 const known=["sine","square","buzz","electric","triangle","hum","white","hiss","narrow","widehiss","air","steam","static","crackle","pink","brown","pulse","flutter","warble","waver","metallic","glass","shimmer","dual","fan","jet","engine","cicada","cricket","radio","cloud","highring","softring","whistle","reference"];
 if(known.includes(t))return t;
 if(t.includes("whistle"))return "whistle";
 if(t.includes("ring"))return "highring";
 if(t.includes("buzz")||t.includes("electric"))return "electric";
 if(t.includes("noise")||t.includes("hiss"))return "hiss";
 return "sine";
}

window.IOSNative={
 send:function(action,data){try{window.webkit.messageHandlers.nativeAudio.postMessage(Object.assign({action:action},data||{}))}catch(e){}},
 start:function(){this.send("start")}, stop:function(){this.send("stop")}, clear:function(){this.send("clear")},
 saveProfile:function(){this.send("saveProfile")}, restoreProfile:function(){this.send("restoreProfile")},
 dtPlay:function(){this.send("dtPlay")}, dtStop:function(){this.send("dtStop")}, dtVolume:function(v){this.send("dtVolume",{value:v})},
 add:function(t,f,v,b,p){this.send("add",{type:t,frequency:f,volume:v,band:b,pulse:p})},
 frequency:function(v){this.send("frequency",{value:v})}, bandwidth:function(v){this.send("bandwidth",{value:v})},
 pulse:function(v){this.send("pulse",{value:v})}, volume:function(v){this.send("volume",{value:v})},
 pan:function(v){this.send("pan",{value:v})}, timer:function(m){this.send("timer",{minutes:m})}
};
(function(){
 const num=(v,d)=>{v=Number(v);return Number.isFinite(v)?v:d};
 function def(c){let i=num(c.dataset.idx,-1);return (typeof defs!=="undefined"&&i>=0&&defs[i])?defs[i]:null}
 document.addEventListener("click",e=>{
  let c=e.target.closest?.("#sounds .sound"); if(!c)return;
  setTimeout(()=>{
   IOSNative.clear();IOSNative.dtStop();let synth=0;
   document.querySelectorAll("#sounds .sound.active").forEach(x=>{
    let d=def(x);if(!d)return;
    const type=d[2]||"sine", name=d[1]||"", p=d[3]||{};
    if(type==="dtsound"||String(name).toLowerCase()==="dt.sound"){IOSNative.dtPlay(); IOSNative.dtVolume(Math.max(0,Math.min(1,num(p.vol,35)/100)))}
    else {IOSNative.add(iosNativeType(type),num(p.freq,7700),Math.max(0,Math.min(1,num(p.vol,28)/100)),num(p.band,900),num(p.mod,0));synth++;}
   });
   if(synth)IOSNative.start();
  },30);
 },true);
 document.addEventListener("input",e=>{
  let id=e.target?.id||"",v=num(e.target?.value,0);
  if(id==="freq"||id==="frequency")IOSNative.frequency(v);
  if(id==="band"||id==="bandwidth")IOSNative.bandwidth(v);
  if(id==="pulse"||id==="speed")IOSNative.pulse(v);
  if(id==="vol"||id==="v27vol"){let q=Math.max(0,Math.min(1,v/num(e.target.max,100)));IOSNative.volume(q);IOSNative.dtVolume(q);}
 },true);
})();
document.addEventListener("click",function(e){
 if(!e.target.closest?.("#v27startTimer"))return;
 setTimeout(function(){
  const sec=Number(document.getElementById("v27duration")?.value||0);
  IOSNative.timer(sec>0?Math.ceil(sec/60):0);
 },20);
},true);

document.addEventListener("DOMContentLoaded",function(){
 if(!(window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.nativeAudio))return;
 let b=document.createElement("div");
 b.textContent="iPhone Native Audio";
 b.style.cssText="position:fixed;right:10px;top:10px;z-index:99999;background:#082b3a;color:#8fe6ff;border:1px solid #236a83;border-radius:12px;padding:5px 9px;font:11px system-ui;opacity:.82";
 document.body.appendChild(b);
});

document.addEventListener("visibilitychange",function(){
 if(document.hidden){ try{IOSNative.saveProfile()}catch(e){} }
});
window.addEventListener("pagehide",function(){try{IOSNative.saveProfile()}catch(e){}});

window.addEventListener("fth-dt-status",function(e){
 if(e.detail && e.detail.available===false){
  const msg="dt.sound original recording is not installed in this build.";
  if(typeof showToast==="function") showToast(msg,"error");
  else console.warn(msg);
 }
});
