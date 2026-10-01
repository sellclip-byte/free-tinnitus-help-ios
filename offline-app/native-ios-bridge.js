
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
 /* Web/PWA sound cards are handled exclusively by the Web Audio library engine.
    Native audio remains available only for explicit native controls (timer/pan/etc.).
    This prevents iPhone from clearing/replacing the selected card after every tap. */
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
