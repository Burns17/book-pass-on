import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { BookOpen } from "lucide-react";

interface TextbookCardProps {
  textbook: {
    id: string;
    title: string;
    author?: string;
    isbn?: string;
    edition?: string;
    condition?: string;
    photo_url?: string;
    status: string;
  };
  onRequest?: (id: string) => void;
  showRequestButton?: boolean;
}

const TextbookCard = ({ textbook, onRequest, showRequestButton = true }: TextbookCardProps) => {
  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case "new":
        return "bg-secondary text-secondary-foreground";
      case "like-new":
        return "bg-primary/20 text-primary";
      case "good":
        return "bg-accent/20 text-accent";
      case "fair":
        return "bg-muted text-muted-foreground";
      case "poor":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-secondary text-secondary-foreground";
      case "reserved":
        return "bg-accent/20 text-accent";
      case "lent":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-[var(--shadow-card)]">
      <CardHeader className="p-0">
        <div className="aspect-[3/4] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
          {textbook.photo_url ? (
            <img
              src={textbook.photo_url}
              alt={textbook.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <BookOpen className="h-24 w-24 text-muted-foreground/30" />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2">{textbook.title}</h3>
          <Badge className={getStatusColor(textbook.status)}>
            {textbook.status}
          </Badge>
        </div>
        {textbook.author && (
          <p className="text-sm text-muted-foreground">by {textbook.author}</p>
        )}
        <div className="flex gap-2 flex-wrap">
          {textbook.condition && (
            <Badge variant="outline" className={getConditionColor(textbook.condition)}>
              {textbook.condition}
            </Badge>
          )}
          {textbook.edition && (
            <Badge variant="outline">{textbook.edition} ed.</Badge>
          )}
        </div>
        {textbook.isbn && (
          <p className="text-xs text-muted-foreground">ISBN: {textbook.isbn}</p>
        )}
      </CardContent>
      {showRequestButton && textbook.status === "available" && onRequest && (
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={() => onRequest(textbook.id)}
            className="w-full"
            variant="default"
          >
            Request Book
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default TextbookCard;