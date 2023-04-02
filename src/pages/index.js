import React, { useState, useRef, useEffect } from 'react';
import Loading from 'react-loading';

export default function Home() {
  const [images, setImages] = useState([]);
  const [completedImages, setCompletedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [socket, setSocket] = useState(null);

  async function sendImages(imageFiles) {
    setIsLoading(true);
    const imageDatas = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const reader = new FileReader();
      reader.readAsDataURL(imageFiles[i]);
      reader.onloadend = function () {
        imageDatas.push(reader.result);
        if (imageDatas.length === imageFiles.length) {
          const message = {
            type: 'process_images',
            data: imageDatas,
          };
          console.log(message);
          socket.send(JSON.stringify(message));
        }
      }
    }
  }

  useEffect(() => {
    const newSocket = new WebSocket('ws://localhost:8001/ws/object_detection/');
    setSocket(newSocket);

    newSocket.onopen = () => {
      console.log('WebSocket connection established.');
    }

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message:', data);
      if (data.type === 'result') {
        setCompletedImages((prevImages) => [...prevImages, data.data]);
        setIsLoading(false);
      }
    }


    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    }

    return () => {
      newSocket.close();
      console.log('WebSocket connection closed.');
    }
  }, []);

  const handleFileChange = (event) => {
    const files = event.target.files;
    console.log(files)
    sendImages(files);
  };

  console.log(completedImages)
  return (
    <div>
      <h1>Object Detection</h1>
      <input type="file" onChange={handleFileChange} ref={fileInputRef} multiple />
     
      {isLoading && <Loading />}
      {completedImages?.map((imageList, index) => (
        <div key={index}>
          {imageList?.map((image, idx) => (
            <div key={idx}>
              <img
                src={`data:image/jpeg;base64,${image}`}
                id={`image-${index}-${idx}`}
                style={{ display: 'none' }}
                onLoad={() => {
                  setTimeout(() => {
                    const imgElement = document.querySelector(`#image-${index}-${idx}`);
                    if (imgElement) {
                      imgElement.style.display = 'block';
                    }
                  }, 1000 * idx);
                }}
              />
            </div>
          ))}
        </div>
      ))}

    </div>
  )
}
