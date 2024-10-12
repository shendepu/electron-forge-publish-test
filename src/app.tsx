import { createRoot } from 'react-dom/client';

const App = () => {
  return (
    <div>
      <h2>Simple App</h2>
    </div>
  )
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);