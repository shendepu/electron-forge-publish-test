import { createRoot } from 'react-dom/client';

const App = () => {
  return (
    <div>
      <h2>Hello World</h2>
    </div>
  )
}

const root = createRoot(document.body);
root.render(<App />);