import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  Settings,
  Menu,
  X,
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/create-invoice', icon: PlusCircle, label: 'New Invoice' },
    { path: '/invoices', icon: FileText, label: 'Invoices' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/businesses', icon: Building, label: 'Businesses' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];
  
  return (
    <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 transition-all duration-300 z-50 ${open ? 'w-64' : 'w-16'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          {open && (
            <div>
              <h1 className="text-xl font-bold text-slate-800">BillPro</h1>
              <p className="text-xs text-slate-500">Sports Clothing</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            className="ml-auto"
            data-testid="sidebar-toggle-btn"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
        
        {/* Menu Items */}
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={20} />
                {open && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        
        {/* Footer */}
        {open && (
          <div className="p-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              © 2025 BillPro
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
