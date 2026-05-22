import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Calendar,
    Users,
    Settings,
    LogOut,
    PlusCircle,
    Ticket,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";

export default function DashboardSidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const adminLinks = [
        { name: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Pending Events', href: '/admin/pending-events', icon: Calendar },
        // { name: 'User Management', href: '/admin/users', icon: Users },
    ];

    const organizerLinks = [
        { name: 'Dashboard', href: '/organizer/dashboard', icon: LayoutDashboard },
        { name: 'Create Event', href: '/organizer/create-event', icon: PlusCircle },
        { name: 'My Events', href: '/organizer/my-events', icon: Calendar },
    ];

    const customerLinks = [
        { name: 'My Registrations', href: '/customer/dashboard', icon: Ticket },
        { name: 'Browse Events', href: '/events', icon: Calendar }, // Public page
        { name: 'Profile', href: '/customer/profile', icon: Users },
    ];

    let links = [];
    if (user?.role === 'admin') links = adminLinks;
    else if (user?.role === 'organizer') links = organizerLinks;
    else links = customerLinks;

    return (
        <div className="w-64 bg-background border-r border-border h-screen flex flex-col sticky top-0">
            <div className="p-6">
                <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-8 h-8 text-rose-500" />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-orange-500">
                        EMS
                    </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground uppercase tracking-widest">
                    {user?.role} Portal
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {links.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-rose-500/10 text-rose-500'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.name}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="active-nav"
                                    className="absolute left-0 w-1 h-8 bg-rose-500 rounded-r-full"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                    onClick={() => logout(navigate)}
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
