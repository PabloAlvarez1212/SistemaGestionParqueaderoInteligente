import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <div className="main-content">
      <Header />
      <main className="page-wrapper">{children}</main>
    </div>
  </div>
);

export default Layout;
