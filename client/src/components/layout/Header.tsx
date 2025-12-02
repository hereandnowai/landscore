'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Map,
  MessageSquare,
  Settings,
  Menu,
  User,
  BarChart3,
  Pencil,
  LogOut,
  Moon,
  Sun,
  Bell,
  HelpCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface HeaderProps {
  onToggleSearch: () => void;
  onToggleChat: () => void;
  onToggleAnalytics: () => void;
  onToggleDrawing: () => void;
  searchOpen: boolean;
  chatOpen: boolean;
  analyticsOpen: boolean;
  drawingOpen: boolean;
}

export function Header({ 
  onToggleSearch, 
  onToggleChat, 
  onToggleAnalytics,
  onToggleDrawing,
  searchOpen, 
  chatOpen,
  analyticsOpen,
  drawingOpen,
}: HeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <>
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 z-50">
      {/* Left Section - Logo & Brand */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Map className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg hidden sm:inline">LANDSCORE</span>
        </Link>
        
        <div className="hidden md:block h-6 w-px bg-border" />
        
        <nav className="hidden md:flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={searchOpen ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={onToggleSearch}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search and filter parcels</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={chatOpen ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={onToggleChat}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  AI Assistant
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chat with AI to query parcels</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={analyticsOpen ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={onToggleAnalytics}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </TooltipTrigger>
              <TooltipContent>View market analytics</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={drawingOpen ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={onToggleDrawing}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Draw
                </Button>
              </TooltipTrigger>
              <TooltipContent>Drawing and measurement tools</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
      </div>

      {/* Center Section - Location Info */}
      <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
        <Map className="h-4 w-4" />
        <span>Austin, Texas, USA</span>
      </div>

      {/* Right Section - User Menu */}
      <div className="flex items-center gap-2">
        {/* Settings Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden md:flex"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Demo User</p>
                <p className="text-xs text-muted-foreground">admin@landscore.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell className="mr-2 h-4 w-4" />
              <span>Notifications</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help & Support</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>

    {/* Settings Dialog */}
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your LANDSCORE experience
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Toggle dark theme
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email alerts
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Map Style</Label>
              <p className="text-sm text-muted-foreground">
                Voyager (Default)
              </p>
            </div>
            <Button variant="outline" size="sm">Change</Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Default Location</Label>
              <p className="text-sm text-muted-foreground">
                Austin, Texas, USA
              </p>
            </div>
            <Button variant="outline" size="sm">Edit</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

export default Header;
