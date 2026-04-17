import BriefingAirportsBox from "../component/BriefingAirportsBox";
import NotamBox from "../component/Notambox";

export default function DashPage() {
  return (
    <main style={{ padding: "20px" }}>
      <h1>NOTAM Pro Dash</h1>
      <BriefingAirportsBox />
      <NotamBox />
    </main>
  );
}