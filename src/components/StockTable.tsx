import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Stock {
  name: string;
  symbol: string;
  price: string;
}

interface StockTableProps {
  stocks: Stock[];
}

const StockTable = ({ stocks }: StockTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empresa</TableHead>
          <TableHead>Símbolo</TableHead>
          <TableHead className="text-right">Precio (VES)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stocks.map((stock) => (
          <TableRow key={stock.symbol}>
            <TableCell className="font-medium">{stock.name}</TableCell>
            <TableCell>{stock.symbol}</TableCell>
            <TableCell className="text-right">{stock.price}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default StockTable;