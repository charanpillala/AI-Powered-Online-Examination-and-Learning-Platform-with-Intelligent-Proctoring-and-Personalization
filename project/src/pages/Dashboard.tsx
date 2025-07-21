import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/auth/AuthContext";
import { FileText, FileQuestion, Award, BookOpen, Zap, Calendar, TrendingUp, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import JoinClassButton from "@/components/dashboard/JoinClassButton";

interface RecentActivity {
  id: string;
  type: "quiz" | "material" | "achievement";
  title: string;
  description: string;
  date: Date;
}

interface UpcomingQuiz {
  id: string;
  title: string;
  dueDate: Date;
  completed: boolean;
}

const Dashboard = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState<UpcomingQuiz[]>([]);

  useEffect(() => {
    const mockActivities: RecentActivity[] = [
      {
        id: "activity1",
        type: "quiz",
        title: "Advanced Physics Quiz",
        description: isTeacher ? "Quiz created" : "Quiz completed with score 85%",
        date: new Date(Date.now() - 3600000),
      },
      {
        id: "activity2",
        type: "material",
        title: "Machine Learning Fundamentals",
        description: isTeacher ? "Material uploaded" : "Material accessed",
        date: new Date(Date.now() - 86400000),
      },
      {
        id: "activity3",
        type: "achievement",
        title: "Perfect Score",
        description: "Achieved 100% on Mathematics Quiz",
        date: new Date(Date.now() - 259200000),
      },
    ];

    const mockQuizzes: UpcomingQuiz[] = [
      {
        id: "quiz1",
        title: "Computer Science Fundamentals",
        dueDate: new Date(Date.now() + 172800000),
        completed: false,
      },
      {
        id: "quiz2",
        title: "Organic Chemistry",
        dueDate: new Date(Date.now() + 432000000),
        completed: false,
      },
      {
        id: "quiz3",
        title: "World History",
        dueDate: new Date(Date.now() + 604800000),
        completed: false,
      },
    ];

    setActivities(mockActivities);
    setUpcomingQuizzes(mockQuizzes);
  }, [isTeacher]);

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return diffInHours === 0 ? 'Just now' : `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const formatDueDate = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `Due in ${diffInHours} hour${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Due in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "quiz":
        return <FileQuestion className="h-5 w-5 text-quiz-blue" />;
      case "material":
        return <FileText className="h-5 w-5 text-quiz-purple" />;
      case "achievement":
        return <Award className="h-5 w-5 text-quiz-accent" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };
  
  const studentStats = [
    { title: "Quizzes Completed", value: 12, icon: FileQuestion, color: "text-quiz-blue" },
    { title: "Learning Streak", value: "7 days", icon: Zap, color: "text-quiz-accent" },
    { title: "Materials Studied", value: 15, icon: BookOpen, color: "text-quiz-purple" },
    { title: "Achievements", value: 8, icon: Award, color: "text-emerald-500" },
  ];
  
  const teacherStats = [
    { title: "Quizzes Created", value: 24, icon: FileQuestion, color: "text-quiz-blue" },
    { title: "Materials Uploaded", value: 18, icon: FileText, color: "text-quiz-purple" },
    { title: "Students", value: 45, icon: Award, color: "text-quiz-accent" },
    { title: "Avg. Score", value: "76%", icon: TrendingUp, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
        <p className="text-muted-foreground">
          {isTeacher ? "Here's what's happening in your classes" : "Here's your learning progress"}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(isTeacher ? teacherStats : studentStats).map((stat, index) => (
          <Card key={index} className="quiz-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-opacity-10 ${stat.color === "text-quiz-blue" ? "bg-quiz-blue-light" : stat.color === "text-quiz-purple" ? "bg-quiz-purple-light" : stat.color === "text-quiz-accent" ? "bg-quiz-accent-light" : "bg-green-100"}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="quiz-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Recent Activity</CardTitle>
            <CardDescription>Your latest interactions with the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className="mr-4 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{activity.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(activity.date)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                </div>
              ))}
              
              {activities.length === 0 && (
                <p className="text-center py-4 text-muted-foreground">
                  No recent activities found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="quiz-card">
          <CardHeader>
            <CardTitle className="text-xl">
              {isTeacher ? "Upcoming Assessments" : "Upcoming Quizzes"}
            </CardTitle>
            <CardDescription>
              {isTeacher ? "Recent assessments you've created" : "Quizzes you need to complete"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingQuizzes.map((quiz) => (
                <div key={quiz.id} className="border rounded-lg p-3 bg-background">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDueDate(quiz.dueDate)}
                      </span>
                    </div>
                    {quiz.completed && (
                      <span className="text-xs bg-green-100 text-green-700 py-0.5 px-2 rounded-full font-medium">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="font-medium mb-2">{quiz.title}</p>
                  <div className="flex items-center justify-between">
                    {!isTeacher && <Progress value={quiz.completed ? 100 : 0} className="h-2" />}
                    <Link to={isTeacher ? "/analytics" : "/learning"}>
                      <Button variant="outline" size="sm" className="ml-auto">
                        {isTeacher ? "View Details" : "Start Quiz"}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              
              {upcomingQuizzes.length === 0 && (
                <p className="text-center py-4 text-muted-foreground">
                  No upcoming quizzes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="quiz-card">
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isTeacher ? (
              <>
                <Link to="/upload">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Upload Material
                  </Button>
                </Link>
                <Link to="/create-quiz">
                  <Button variant="outline" className="w-full justify-start">
                    <FileQuestion className="mr-2 h-4 w-4" />
                    Create Quiz
                  </Button>
                </Link>
                <Link to="/analytics">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                </Link>
                <Link to="/students">
                  <Button variant="outline" className="w-full justify-start">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Manage Students
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/materials">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse Materials
                  </Button>
                </Link>
                <Link to="/learning">
                  <Button variant="outline" className="w-full justify-start">
                    <FileQuestion className="mr-2 h-4 w-4" />
                    Practice Quizzes
                  </Button>
                </Link>
                <Link to="/upload">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Upload Notes
                  </Button>
                </Link>
                <JoinClassButton />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
