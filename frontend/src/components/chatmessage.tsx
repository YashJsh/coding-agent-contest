type Props = {
  role: "assistant" | "user";
  content: string;
};

export default function ChatMessage({ role, content }: {
    role : string;
    content : string
}){
  return (
    <div className="flex">
      <div className="border p-2">
        <p className="text-sm">{role}</p>
        <p>{content}</p>
      </div>
    </div>
  );
}