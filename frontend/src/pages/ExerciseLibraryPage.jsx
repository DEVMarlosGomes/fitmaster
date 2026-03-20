import { useState, useEffect, useRef } from "react";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogBody,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dumbbell, Plus, Search, Trash2, Play, X, Edit2, Upload,
  Video, Film, ExternalLink, Eye, Check, Loader2, ChevronDown
} from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

export default function ExerciseLibraryPage() {
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editExercise, setEditExercise] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    instructions: "",
    video_url: "",
    image_url: ""
  });

  useEffect(() => {
    loadCategories();
    loadExercises();
  }, []);

  useEffect(() => {
    loadExercises();
  }, [selectedCategory, searchTerm]);

  const loadCategories = async () => {
    try {
      const response = await api.get("/exercise-library/categories");
      setCategories(response.data.categories);
    } catch (error) {
      console.error("Erro ao carregar categorias");
    }
  };

  const loadExercises = async () => {
    setLoading(true);
    try {
      let url = "/exercise-library";
      const params = [];
      if (selectedCategory) params.push(`category=${selectedCategory}`);
      if (searchTerm) params.push(`search=${searchTerm}`);
      if (params.length > 0) url += `?${params.join("&")}`;

      const response = await api.get(url);
      setExercises(response.data);
    } catch (error) {
      toast.error("Erro ao carregar exercicios");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast.error("Nome e categoria sao obrigatorios");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/exercise-library", formData);
      toast.success("Exercicio adicionado com sucesso!");
      setIsAddDialogOpen(false);
      setFormData({ name: "", category: "", description: "", instructions: "", video_url: "", image_url: "" });
      loadExercises();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao adicionar exercicio");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editExercise) return;
    
    setSubmitting(true);
    try {
      const updateData = {};
      if (formData.name) updateData.name = formData.name;
      if (formData.category) updateData.category = formData.category;
      if (formData.description !== undefined) updateData.description = formData.description;
      if (formData.instructions !== undefined) updateData.instructions = formData.instructions;
      if (formData.video_url !== undefined) updateData.video_url = formData.video_url;
      if (formData.image_url !== undefined) updateData.image_url = formData.image_url;

      await api.put(`/exercise-library/${editExercise.id}`, updateData);
      toast.success("Exercicio atualizado com sucesso!");
      setEditExercise(null);
      loadExercises();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao atualizar exercicio");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este exercicio?")) return;
    try {
      await api.delete(`/exercise-library/${id}`);
      toast.success("Exercicio removido");
      loadExercises();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao remover exercicio");
    }
  };

  const handleVideoUpload = async (exerciseId, file) => {
    if (!file) return;
    
    setUploadingVideo(exerciseId);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      
      const response = await api.post(`/exercise-library/${exerciseId}/upload-video`, formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      toast.success("Video enviado com sucesso!");
      loadExercises();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao enviar video");
    } finally {
      setUploadingVideo(null);
    }
  };

  const handleDeleteVideo = async (exerciseId) => {
    if (!confirm("Remover o video deste exercicio?")) return;
    try {
      await api.delete(`/exercise-library/${exerciseId}/video`);
      toast.success("Video removido");
      loadExercises();
    } catch (error) {
      toast.error("Erro ao remover video");
    }
  };

  const openEditDialog = (exercise) => {
    setEditExercise(exercise);
    setFormData({
      name: exercise.name || "",
      category: exercise.category || "",
      description: exercise.description || "",
      instructions: exercise.instructions || "",
      video_url: exercise.video_url || "",
      image_url: exercise.image_url || ""
    });
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes("/embed/")) return url;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    return url;
  };

  const hasVideo = (exercise) => {
    return exercise.video_url || exercise.mp4_video_url;
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSearchTerm("");
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase" data-testid="exercise-library-title">
              Biblioteca de Exercicios
            </h1>
            <p className="text-muted-foreground mt-1">
              {exercises.length} exercicio{exercises.length !== 1 ? "s" : ""} disponive{exercises.length !== 1 ? "is" : "l"}
              {" "} - Clique em um exercicio para editar ou adicionar video
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="add-exercise-btn">
                <Plus className="w-4 h-4" />
                Criar Exercicio
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold uppercase">Novo Exercicio</DialogTitle>
                <DialogDescription>Adicione um exercicio personalizado a biblioteca</DialogDescription>
              </DialogHeader>
              <DialogBody>
                <form id="exercise-form" onSubmit={handleSubmit} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-secondary/50 border-white/10"
                      placeholder="Ex: Supino Inclinado com Halteres"
                      data-testid="exercise-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria *</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger className="bg-secondary/50 border-white/10" data-testid="exercise-category-select">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descricao</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-secondary/50 border-white/10"
                      placeholder="Breve descricao do exercicio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Instrucoes</Label>
                    <Textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      className="bg-secondary/50 border-white/10"
                      placeholder="Passo a passo de execucao"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL do Video (YouTube)</Label>
                    <Input
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      className="bg-secondary/50 border-white/10"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL da Imagem</Label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="bg-secondary/50 border-white/10"
                      placeholder="https://..."
                    />
                  </div>
                </form>
              </DialogBody>
              <DialogFooter>
                <Button type="submit" form="exercise-form" disabled={submitting} data-testid="submit-exercise-btn">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Adicionar Exercicio"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80 transition-colors"
                onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
                data-testid={`filter-category-${cat}`}
              >
                {cat}
              </Badge>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar exercicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary/50 border-white/10"
                data-testid="search-exercise-input"
              />
            </div>
            {(selectedCategory || searchTerm) && (
              <Button variant="outline" onClick={clearFilters} className="gap-2" data-testid="clear-filters-btn">
                <X className="w-4 h-4" />
                Limpar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Exercises Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : exercises.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Dumbbell className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">Nenhum exercicio encontrado</p>
              <p className="text-muted-foreground text-center">Tente ajustar os filtros ou adicione um novo exercicio</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                index={index}
                onEdit={openEditDialog}
                onDelete={handleDelete}
                onVideoUpload={handleVideoUpload}
                onDeleteVideo={handleDeleteVideo}
                onVideoPreview={setVideoPreview}
                uploadingVideo={uploadingVideo}
                hasVideo={hasVideo}
                getEmbedUrl={getEmbedUrl}
              />
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editExercise} onOpenChange={(open) => !open && setEditExercise(null)}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold uppercase">Editar Exercicio</DialogTitle>
              <DialogDescription>Atualize os dados do exercicio</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <form id="edit-exercise-form" onSubmit={handleEdit} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-secondary/50 border-white/10"
                    data-testid="edit-exercise-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger className="bg-secondary/50 border-white/10" data-testid="edit-exercise-category">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descricao</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-secondary/50 border-white/10"
                    placeholder="Descricao do exercicio"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instrucoes de Execucao</Label>
                  <Textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="bg-secondary/50 border-white/10"
                    placeholder="Passo a passo de como executar"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL do Video (YouTube)</Label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    className="bg-secondary/50 border-white/10"
                    placeholder="https://www.youtube.com/watch?v=..."
                    data-testid="edit-exercise-video-url"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL da Imagem</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="bg-secondary/50 border-white/10"
                    placeholder="https://..."
                  />
                </div>

                {/* Upload de video MP4 */}
                <div className="space-y-2">
                  <Label>Upload de Video (MP4/WebM/MOV)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files[0] && editExercise) {
                          handleVideoUpload(editExercise.id, e.target.files[0]);
                        }
                      }}
                      data-testid="edit-exercise-video-file"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 flex-1"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingVideo === editExercise?.id}
                      data-testid="upload-video-btn"
                    >
                      {uploadingVideo === editExercise?.id ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                      ) : (
                        <><Upload className="w-4 h-4" /> Selecionar Video</>
                      )}
                    </Button>
                    {editExercise?.mp4_video_url && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteVideo(editExercise.id)}
                        data-testid="delete-uploaded-video-btn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {editExercise?.mp4_video_url && (
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Video MP4 enviado
                    </p>
                  )}
                </div>
              </form>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditExercise(null)} data-testid="cancel-edit-btn">
                Cancelar
              </Button>
              <Button type="submit" form="edit-exercise-form" disabled={submitting} data-testid="save-edit-btn">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Alteracoes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Video Preview Dialog */}
        <Dialog open={!!videoPreview} onOpenChange={(open) => !open && setVideoPreview(null)}>
          <DialogContent className="bg-card border-border max-w-3xl p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle className="text-lg font-bold uppercase">
                <span>{videoPreview?.name}</span>
              </DialogTitle>
            </DialogHeader>
            <DialogBody className="p-0">
              <div className="aspect-video w-full bg-black">
                {videoPreview?.mp4_video_url ? (
                  <video
                    src={`${process.env.REACT_APP_BACKEND_URL}/api${videoPreview.mp4_video_url}`}
                    controls
                    className="w-full h-full"
                    autoPlay
                  />
                ) : videoPreview?.video_url ? (
                  <iframe
                    src={getEmbedUrl(videoPreview.video_url)}
                    title={videoPreview.name}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Play className="w-16 h-16 mb-4" />
                    <p>Video nao disponivel</p>
                  </div>
                )}
              </div>
            </DialogBody>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

function ExerciseCard({ exercise, index, onEdit, onDelete, onVideoUpload, onDeleteVideo, onVideoPreview, uploadingVideo, hasVideo, getEmbedUrl }) {
  const fileRef = useRef(null);
  const videoAvailable = hasVideo(exercise);

  return (
    <Card
      className="bg-card border-border hover:border-primary/50 transition-all duration-200 animate-slide-up overflow-hidden group"
      style={{ animationDelay: `${index * 20}ms` }}
      data-testid={`exercise-card-${exercise.id}`}
    >
      {/* Image / Video preview area */}
      <div className="aspect-video bg-secondary/30 relative overflow-hidden">
        {exercise.image_url ? (
          <img
            src={exercise.image_url}
            alt={exercise.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Dumbbell className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Video overlay */}
        {videoAvailable && (
          <button
            onClick={() => onVideoPreview(exercise)}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            data-testid={`play-video-${exercise.id}`}
          >
            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
              <Play className="w-7 h-7 text-white ml-1" />
            </div>
          </button>
        )}

        {/* Video badge */}
        {videoAvailable && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-primary/90 text-white text-xs gap-1">
              <Video className="w-3 h-3" />
              {exercise.mp4_video_url ? "MP4" : "YT"}
            </Badge>
          </div>
        )}

        {/* System badge */}
        {exercise.is_system && (
          <div className="absolute top-2 left-2">
            <Badge variant="outline" className="bg-black/60 text-white/80 text-xs border-white/20">
              Sistema
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm line-clamp-2" data-testid={`exercise-name-${exercise.id}`}>
              {exercise.name}
            </h3>
            <Badge variant="outline" className="mt-1.5 text-xs">{exercise.category}</Badge>
          </div>
        </div>

        {exercise.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{exercise.description}</p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 flex-1 text-xs h-8"
            onClick={() => onEdit(exercise)}
            data-testid={`edit-exercise-${exercise.id}`}
          >
            <Edit2 className="w-3 h-3" />
            Editar
          </Button>

          {/* Quick upload video button */}
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => {
              if (e.target.files[0]) {
                onVideoUpload(exercise.id, e.target.files[0]);
              }
            }}
          />
          <Button
            variant={videoAvailable ? "default" : "outline"}
            size="sm"
            className="gap-1 text-xs h-8"
            onClick={() => fileRef.current?.click()}
            disabled={uploadingVideo === exercise.id}
            data-testid={`upload-video-card-${exercise.id}`}
          >
            {uploadingVideo === exercise.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <><Upload className="w-3 h-3" /> Video</>
            )}
          </Button>

          {videoAvailable && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onVideoPreview(exercise)}
              data-testid={`preview-video-${exercise.id}`}
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
          )}

          {exercise.personal_id && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
              onClick={() => onDelete(exercise.id)}
              data-testid={`delete-exercise-${exercise.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
