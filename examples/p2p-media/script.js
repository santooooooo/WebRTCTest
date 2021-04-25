const Peer = window.Peer;

(async function main() {
  const localVideo = document.getElementById('js-local-stream');
  const localId = document.getElementById('js-local-id');
  const callTrigger = document.getElementById('js-call-trigger');
  const closeTrigger = document.getElementById('js-close-trigger');
  const remoteVideo = document.getElementById('js-remote-stream');
  const remoteId = document.getElementById('js-remote-id');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');

  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();

	let localStream;

  await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    }).
		then(async stream => {
			localStream = stream;
		  localVideo.muted = true;
		  localVideo.srcObject = stream;
		  localVideo.playsInline = true;
		  await localVideo.play().catch(console.error);
    })
    .catch(async error => {
	    localStream = await navigator.mediaDevices.getUserMedia({
		    audio: true,
		    video: false,
	    })
		  .catch(console.error(error));

		  localVideo.muted = true;
		  localVideo.srcObject = localStream;
		  localVideo.playsInline = true;
		  await localVideo.play().catch(console.error);
    });

  // Render local stream
//  localVideo.muted = true;
//  localVideo.srcObject = localStream;
//  localVideo.playsInline = true;
//  await localVideo.play().catch(console.error);

  const peer = (window.peer = new Peer({
    key: '888b2d3e-7497-4a0b-adec-e4bb488433ee',
    debug: 3,
  }));

  // Register caller handler
  callTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    const mediaConnection = peer.call(remoteId.value, localStream);

    mediaConnection.on('stream', async stream => {
      // Render remote stream for caller
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener('click', () => mediaConnection.close(true));
  });

  peer.once('open', id => (localId.textContent = id));

  // Register callee handler
  peer.on('call', mediaConnection => {
    mediaConnection.answer(localStream);

    mediaConnection.on('stream', async stream => {
      // Render remote stream for callee
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener('click', () => mediaConnection.close(true));
  });

  peer.on('error', console.error);
})();
