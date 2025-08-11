import { createHashRouter, RouterProvider } from "react-router";
import Layout from './components/Layout';
import Home from './components/Home';
import SymmetricCrypto from './components/SymmetricCrypto';
import AsymmetricCrypto from './components/AsymmetricCrypto';
import './App.css'

const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "symmetric",
        element: <SymmetricCrypto />,
      },
      {
        path: "asymmetric",
        element: <AsymmetricCrypto />,
      },
    ],
  },
]);

function App() {

  return (
    <RouterProvider router={router} />
  );
}

export default App;
