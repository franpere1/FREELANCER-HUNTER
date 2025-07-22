import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 relative">
      <div className="absolute top-4 right-4">
        <Link to="/signup">
          <Button>Inicio / Registro</Button>
        </Link>
      </div>
      <div className="text-center">
        <Briefcase className="mx-auto h-24 w-24 text-indigo-500 mb-4" />
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
          FREELANCER HUNTER
        </h1>
        <p className="text-xl text-gray-600 mt-4">
          Conectando clientes con los mejores profesionales.
        </p>
      </div>
      <div className="absolute bottom-0 w-full">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;