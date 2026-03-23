import { Card, CardContent } from "./ui/card";
import { Play, Dumbbell, ChevronRight } from "lucide-react";

export const ExerciseCard = ({ exercise, index, onClick }) => {
  const defaultImage = "https://images.unsplash.com/photo-1700784795176-7ff886439d79?crop=entropy&cs=srgb&fm=jpg&q=85&w=400";

  return (
    <Card
      className="card-hover animate-slide-up cursor-pointer overflow-hidden border-border/70 bg-card/75"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={onClick}
      data-testid={`exercise-card-${index}`}
    >
      <CardContent className="p-0">
        <div className="flex items-stretch">
          {/* Image Section */}
          <div className="relative w-24 shrink-0 sm:w-32">
            <img
              src={exercise.image_url || defaultImage}
              alt={exercise.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card/95" />
            {exercise.video_url && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full border border-white/15 bg-primary/80 p-2 backdrop-blur-sm">
                  <Play className="h-4 w-4 fill-white text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-black tracking-[-0.03em]">{exercise.name}</h3>
                {exercise.muscle_group && (
                  <p className="text-sm font-semibold text-primary">{exercise.muscle_group}</p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>

            {/* Sets & Reps */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border/70 bg-secondary/45 px-3 py-1.5">
                <Dumbbell className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-sm font-semibold">
                  {exercise.sets}x {exercise.reps}
                </span>
              </div>
              {exercise.weight && (
                <span className="text-sm text-muted-foreground">{exercise.weight}</span>
              )}
            </div>

            {/* Notes */}
            {exercise.notes && (
              <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                {exercise.notes}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
