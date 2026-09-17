import { BlockTable } from './slices/day7/actor/blocktable/BlockTable';
import blockTableSample from './slices/day7/actor/blocktable/samples/sample-1.json';
import { TableBlocks } from './slices/day7/actor/tableblocks/TableBlocks';
import { TableStatus } from './slices/day7/actor/tablestatus/TableStatus';

function App() {
  return (
    <>
      <BlockTable {...blockTableSample} />
      <TableBlocks tableNumber="12" date="15.04.2026" />
      <TableStatus tables={['7', '12', '15']} date="15.04.2026" />
    </>
  );
}

export default App;
