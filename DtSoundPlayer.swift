import AVFoundation

final class DtSoundPlayer: NSObject, AVAudioPlayerDelegate {
 static let shared=DtSoundPlayer()
 private var player:AVAudioPlayer?
 private var currentPan:Float=0
 private override init(){super.init()}
 var isAvailable:Bool {
  Bundle.main.url(forResource:"reference-original",withExtension:"mp3",subdirectory:"Web") != nil
 }
 @discardableResult func play()->Bool {
  guard let url=Bundle.main.url(forResource:"reference-original",withExtension:"mp3",subdirectory:"Web") else{return false}
  do{
   let p=try AVAudioPlayer(contentsOf:url)
   p.numberOfLoops = -1
   p.volume = 0.18
   p.pan = currentPan
   p.prepareToPlay()
   player=p
   let ok=p.play()
   if ok { NowPlayingManager.shared.update(title:"dt.sound",playing:true) }
   return ok
  }catch{return false}
 }
 func stop(){player?.stop();player=nil}
 func setVolume(_ v:Double){player?.volume=Float(max(0,min(0.5,v)))}
 func setPan(_ v:Double){
  currentPan=Float(max(-1,min(1,v)))
  player?.pan=currentPan
 }
}
