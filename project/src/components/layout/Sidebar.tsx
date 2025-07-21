
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Home, 
  Upload, 
  BookOpen, 
  BarChart, 
  MessageSquare, 
  Award, 
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  Users
} from "lucide-react";

interface SidebarProps {
  isTeacher: boolean;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  teacherOnly?: boolean;
  studentOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Materials",
    href: "/materials",
    icon: FileText,
  },
  {
    title: "Upload Content",
    href: "/upload",
    icon: Upload,
  },
  {
    title: "Create Quiz",
    href: "/create-quiz",
    icon: FileQuestion,
    teacherOnly: true,
  },
  {
    title: "Learning",
    href: "/learning",
    icon: BookOpen,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart,
  },
  {
    title: "Students",
    href: "/students",
    icon: Users,
    teacherOnly: true,
  },
  {
    title: "AI Chat",
    href: "/ai-chat",
    icon: MessageSquare,
  },
  {
    title: "Achievements",
    href: "/achievements",
    icon: Award,
    studentOnly: true,
  },
];

const Sidebar = ({ isTeacher }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const filteredNavItems = navItems.filter(item => {
    if (isTeacher) {
      return !item.studentOnly;
    } else {
      return !item.teacherOnly;
    }
  });

  return (
    <aside 
      className={cn(
        "border-r bg-sidebar transition-all duration-300 ease-in-out fixed md:relative z-30 h-screen",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-end p-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={toggleSidebar}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>
        
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 py-2">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <item.icon className={cn("h-5 w-5 mr-2 flex-shrink-0", collapsed && "mr-0")} />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            ))}
          </div>
        </ScrollArea>
        
        <div className={cn(
          "p-4 mt-auto border-t border-sidebar-border flex items-center",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <div className={cn("flex items-center gap-2", collapsed && "hidden")}>
            <div className="bg-quiz-purple rounded-full h-6 w-6 flex items-center justify-center text-white text-xs font-medium">
              {isTeacher ? "T" : "S"}
            </div>
            <div className="text-xs">
              <p className="font-semibold">{isTeacher ? "Teacher" : "Student"} Mode</p>
            </div>
          </div>
          
          {collapsed && (
            <div className="bg-quiz-purple rounded-full h-8 w-8 flex items-center justify-center text-white">
              {isTeacher ? "T" : "S"}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
