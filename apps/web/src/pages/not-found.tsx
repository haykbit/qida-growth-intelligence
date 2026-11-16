import { Button, Card, CardContent } from "@qida/ui";
import { ArrowLeft, SearchX } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return <Card><CardContent className="flex min-h-[60vh] flex-col items-center justify-center text-center"><div className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500"><SearchX className="size-6" /></div><h1 className="mt-5 text-xl font-semibold">Esta vista no existe</h1><p className="mt-2 text-sm text-slate-500">Vuelve al inventario de landings.</p><Button className="mt-5" asChild><Link to="/"><ArrowLeft className="size-4" />Ir a landings</Link></Button></CardContent></Card>;
}
