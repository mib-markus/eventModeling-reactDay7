import { BlockTable } from './slices/day7/actor/blocktable/BlockTable';
import blockTableSample from './slices/day7/actor/blocktable/samples/sample-1.json';
import { TableBlocks } from './slices/day7/actor/tableblocks/TableBlocks';
import { TableStatus } from './slices/day7/actor/tablestatus/TableStatus';
import { CreateShift } from './slices/shiftmanagement/manager/createshift/CreateShift';
import createShiftSample from './slices/shiftmanagement/manager/createshift/samples/sample-1.json';
import { MyShiftsPage } from './pages/MyShifts';
import { AttendanceHistory } from './slices/timetracking/employee/attendancehistory/AttendanceHistory';

function App() {
  return (
    <>
      <BlockTable {...blockTableSample} />
      <TableBlocks tableNumber="12" date="15.04.2026" />
      <TableStatus tables={['7', '12', '15']} date="15.04.2026" />
      <CreateShift {...createShiftSample} />
      <MyShiftsPage employeeId="5f2a8c31-7b64-4e08-a91d-3c05f7ba2e69" at="2026-04-15T05:50" />
      <AttendanceHistory employeeId="5f2a8c31-7b64-4e08-a91d-3c05f7ba2e69" month="2026-04" />
    </>
  );
}

export default App;
