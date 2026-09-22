(function(){
 const KEY="fth_ios_diag_v1";
 function save(o){localStorage.setItem(KEY,JSON.stringify(o))}
 function load(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return{}}}
 window.FTHiOSDiagnostic={
  start:function(){
   save({started:Date.now(),visibility:document.visibilityState,hiddenAt:null,returnedAt:null});
   return "started";
  },
  status:function(){
   let x=load(); x.now=Date.now(); x.elapsedSeconds=x.started?Math.round((x.now-x.started)/1000):0; return x;
  },
  clear:function(){localStorage.removeItem(KEY)}
 };
 document.addEventListener("visibilitychange",function(){
  let x=load(); if(!x.started)return;
  if(document.hidden)x.hiddenAt=Date.now(); else x.returnedAt=Date.now();
  x.visibility=document.visibilityState;save(x);
 });
})();