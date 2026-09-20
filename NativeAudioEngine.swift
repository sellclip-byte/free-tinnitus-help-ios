import AVFoundation
import Foundation

final class NativeAudioEngine {
 static let shared=NativeAudioEngine()
 struct Layer { var type:String; var frequency:Double; var volume:Double; var band:Double; var pulse:Double; var phase:Double=0; var phase2:Double=0; var noiseState:Double=0 }
 private let engine=AVAudioEngine()
 private var source:AVAudioSourceNode?
 private let lock=NSLock()
 private var layers:[Layer]=[]
 var master:Double=0.65
 var pan:Double=0 { didSet { DtSoundPlayer.shared.setPan(pan) } }
 private var stopTimer:Timer?
 private var wasPlayingBeforeInterruption=false
 private init(){
  configureSession()
  NotificationCenter.default.addObserver(self,selector:#selector(interruption(_:)),name:AVAudioSession.interruptionNotification,object:nil)
  NotificationCenter.default.addObserver(self,selector:#selector(routeChanged(_:)),name:AVAudioSession.routeChangeNotification,object:nil)
 }
 private func configureSession(){ let s=AVAudioSession.sharedInstance(); try? s.setCategory(.playback,mode:.default,options:[.allowBluetoothA2DP]); try? s.setActive(true,options:[]) }
 func clear(){lock.lock();layers.removeAll();lock.unlock()}
 var hasLayers:Bool { lock.lock(); defer{lock.unlock()}; return !layers.isEmpty }
 func add(type:String,frequency:Double,volume:Double,band:Double=900,pulse:Double=0){lock.lock();layers.append(Layer(type:type,frequency:frequency,volume:min(0.18,max(0,volume)),band:band,pulse:pulse));lock.unlock()}
 func setFrequency(_ v:Double){lock.lock();for i in layers.indices{layers[i].frequency=min(16000,max(100,v))};lock.unlock()}
 func setBandwidth(_ v:Double){lock.lock();for i in layers.indices{layers[i].band=min(8000,max(20,v))};lock.unlock()}
 func setPulse(_ v:Double){lock.lock();for i in layers.indices{layers[i].pulse=min(30,max(0,v))};lock.unlock()}
 func saveProfile(){lock.lock();let saved=layers.map{SavedLayer(type:$0.type,frequency:$0.frequency,volume:$0.volume,band:$0.band,pulse:$0.pulse)};let p=SavedAudioProfile(layers:saved,master:master,pan:pan);lock.unlock();AudioProfileStore.shared.save(p)}
 func restoreProfile()->Bool{guard let p=AudioProfileStore.shared.load() else{return false};lock.lock();layers=p.layers.map{Layer(type:$0.type,frequency:$0.frequency,volume:$0.volume,band:$0.band,pulse:$0.pulse)};master=p.master;pan=p.pan;lock.unlock();return true}
 func start(){
  NowPlayingManager.shared.update(playing:true); if engine.isRunning{return}; configureSession()
  let format=engine.outputNode.inputFormat(forBus:0); let sampleRate=format.sampleRate; var time=0.0
  let renderBlock: AVAudioSourceNodeRenderBlock = { [weak self] _,_,frames,audioBufferList -> OSStatus in
   guard let self=self else{return noErr}; let buffers=UnsafeMutableAudioBufferListPointer(audioBufferList)
   self.lock.lock(); var localLayers=self.layers; self.lock.unlock()
   for frame in 0..<Int(frames){
    var sum=0.0
    for index in localLayers.indices { var layer=localLayers[index]; sum += self.sample(for:&layer,time:time,sampleRate:sampleRate)*layer.volume; localLayers[index]=layer }
    let output=Float(max(-0.72,min(0.72,sum*self.master)))
    for bufferIndex in 0..<buffers.count {
     var side=1.0
     if buffers.count>=2 { if bufferIndex==0 { side=self.pan>0 ? 1.0-self.pan:1.0 } else { side=self.pan<0 ? 1.0+self.pan:1.0 } }
     if let data=buffers[bufferIndex].mData?.assumingMemoryBound(to:Float.self){data[frame]=output*Float(side)}
    }
    time += 1.0/sampleRate
   }
   self.lock.lock(); if self.layers.count==localLayers.count{self.layers=localLayers}; self.lock.unlock(); return noErr
  }
  source=AVAudioSourceNode(renderBlock:renderBlock); if let source=source{engine.attach(source);engine.connect(source,to:engine.mainMixerNode,format:format)}; try? engine.start()
 }
 private func sample(for layer:inout Layer,time:Double,sampleRate:Double)->Double {
  let sine=sin(layer.phase), random=Double.random(in:-1.0...1.0), alpha=min(0.35,max(0.002,layer.band/sampleRate)); layer.noiseState += alpha*(random-layer.noiseState); let pulse=max(0.2,layer.pulse); var value=0.0
  switch layer.type.lowercased(){
   case "square","buzz","electric": value=sine>=0 ? 1:-1
   case "triangle","hum": value=2.0/Double.pi*asin(sine)
   case "white": value=random
   case "pink": value=(random+layer.noiseState*2)/3
   case "brown": layer.noiseState=max(-1,min(1,layer.noiseState+Double.random(in:-0.04...0.04)));value=layer.noiseState
   case "hiss","widehiss","air","steam","static","crackle": value=random*0.72+layer.noiseState*0.28
   case "narrow": value=(random-layer.noiseState)*0.75+sine*0.25
   case "pulse","flutter": value=sine*(0.52+0.48*sin(2*Double.pi*time*pulse))
   case "warble","waver": value=sin(layer.phase+0.28*sin(2*Double.pi*time*pulse))
   case "dual": value=(sine+sin(layer.phase2))/2
   case "metallic","glass","shimmer": value=(sine+0.42*sin(layer.phase2)+0.2*sin(layer.phase*2.01))/1.62
   case "fan": value=0.68*layer.noiseState+0.32*sin(layer.phase*0.025)
   case "jet","engine": value=0.72*layer.noiseState+0.28*sin(layer.phase*0.018)
   case "cicada","cricket": value=(sine>=0 ? 0.5:-0.5)+0.5*sin(layer.phase2)
   case "radio","cloud","reference": value=0.55*layer.noiseState+0.45*sine
   default:value=sine
  }
  layer.phase += 2*Double.pi*layer.frequency/sampleRate; layer.phase2 += 2*Double.pi*(layer.frequency*1.018)/sampleRate
  if layer.phase>2*Double.pi{layer.phase-=2*Double.pi};if layer.phase2>2*Double.pi{layer.phase2-=2*Double.pi};return value
 }
 func stop(){stopTimer?.invalidate();stopTimer=nil;engine.stop();if let s=source{engine.detach(s)};source=nil}
 func timer(minutes:Int){stopTimer?.invalidate();stopTimer=nil;guard minutes>0 else{return};stopTimer=Timer.scheduledTimer(withTimeInterval:Double(minutes*60),repeats:false){_ in DispatchQueue.main.async{self.stop();DtSoundPlayer.shared.stop()}}}
 @objc private func interruption(_ n:Notification){guard let raw=n.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,let type=AVAudioSession.InterruptionType(rawValue:raw) else{return};if type == .began{wasPlayingBeforeInterruption=engine.isRunning;engine.pause()}else{let rawOptions=n.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0;configureSession();if wasPlayingBeforeInterruption && AVAudioSession.InterruptionOptions(rawValue:rawOptions).contains(.shouldResume){try? engine.start()};wasPlayingBeforeInterruption=false}}
 @objc private func routeChanged(_ n:Notification){DtSoundPlayer.shared.setPan(pan)}
}