
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, FileText, FileArchive, File, Image } from "lucide-react";

interface Material {
  id: string;
  title: string;
  description: string | null;
  file_type: string;
  file_url: string;
  teacher_id: string;
  teacher_name?: string;
}

const MaterialIcon = ({ fileType }: { fileType: string }) => {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return <FileText className="w-10 h-10 text-red-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="w-10 h-10 text-blue-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
      return <Image className="w-10 h-10 text-green-500" />;
    case 'zip':
    case 'rar':
      return <FileArchive className="w-10 h-10 text-amber-500" />;
    default:
      return <File className="w-10 h-10 text-gray-500" />;
  }
};

const Materials = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        let query;

        if (user.role === 'teacher') {
          // If teacher, fetch their own materials
          query = supabase
            .from('materials')
            .select('*')
            .eq('teacher_id', user.id);
        } else {
          // If student, fetch materials from their teachers
          const { data: teacherStudents, error: teacherError } = await supabase
            .from('teacher_students')
            .select('teacher_id')
            .eq('student_id', user.id);
          
          if (teacherError) throw teacherError;
          
          if (!teacherStudents || teacherStudents.length === 0) {
            setMaterials([]);
            setIsLoading(false);
            return;
          }
          
          const teacherIds = teacherStudents.map(ts => ts.teacher_id);
          
          query = supabase
            .from('materials')
            .select('*')
            .in('teacher_id', teacherIds as string[]);
        }

        const { data, error } = await query;
        
        if (error) throw error;

        // Get teacher names for each material
        if (data && data.length > 0) {
          const teacherIds = [...new Set(data.map(m => m.teacher_id))];
          
          const { data: teacherData, error: teacherError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', teacherIds as string[]);
          
          if (teacherError) throw teacherError;
          
          const teacherMap = new Map();
          teacherData?.forEach(teacher => teacherMap.set(teacher.id, teacher.full_name));
          
          const materialsWithTeachers = data.map(material => ({
            ...material,
            teacher_name: teacherMap.get(material.teacher_id) || 'Unknown Teacher'
          }));
          
          setMaterials(materialsWithTeachers);
        } else {
          setMaterials(data || []);
        }
      } catch (error) {
        console.error('Error fetching materials:', error);
        toast.error('Failed to load materials');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, [user]);

  const openMaterial = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Learning Materials</h1>
        <p className="text-muted-foreground">Access your study materials and resources</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Materials Library</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : materials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((material) => (
                <div 
                  key={material.id} 
                  className="border rounded-lg p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => openMaterial(material.file_url)}
                >
                  <MaterialIcon fileType={material.file_type} />
                  <div>
                    <h3 className="font-medium">{material.title}</h3>
                    {material.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{material.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">From: {material.teacher_name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">
              {user?.role === 'teacher' 
                ? 'You haven\'t uploaded any materials yet. Go to the Upload page to add study materials.' 
                : 'No materials available. Join a teacher\'s class to access study materials.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Materials;
