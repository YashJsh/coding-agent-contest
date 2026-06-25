import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import Chat from './components/chat';
import FileExplorer from './components/fileExplorer';

function App() {
  const [connection, setConection] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<{
    role: string,
    content: string
  }[]>([]);
  const [files, setFiles] = useState<{
    name : string,
    content : string
  }[]>([]);

  useEffect(() => {
    const conn = new WebSocket("ws://localhost:8000");
    setConection(conn);
  }, []);

  useEffect(() => {
    if (!connection) return;
    const handler = (event: MessageEvent) => {
      const parsedData = JSON.parse(event.data);
      if (parsedData.type == "message"){
        setMessages((prev)=>[...prev,parsedData.data])
      };
      if (parsedData.type == "files"){
        setFiles((prev)=>[...prev, parsedData.data]);
      }
    };

    connection.addEventListener("message", handler);
  }, [connection]);

  return (
    <main className="h-screen flex">
      {/* Chat - 1/3 */}
      <div className="w-1/3 border-r">
        <Chat messages={messages!} connection={connection!} setMessages={setMessages} />
      </div>

      {/* Files - 2/3 */}
      <div className="w-2/3">
        <FileExplorer files={files}/>
      </div>
    </main>
  )
}

export default App
