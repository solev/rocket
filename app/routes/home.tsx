import { Welcome } from "../welcome/welcome";

export function meta() {
  return [
    { title: "Home" },
    { name: "description", content: "Welcome" },
  ];
}

export default function Home() {
  return <Welcome />;
}
