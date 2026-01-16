import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GALLERY_DATA = [
  { id: "1", title: "Tresse moderne", category: "Coiffure", color: "bg-primary/20" },
  { id: "2", title: "Locks naturels", category: "Coiffure", color: "bg-accent/40" },
  { id: "3", title: "Maquillage mariage", category: "Maquillage", color: "bg-chart-3/20" },
  { id: "4", title: "Manucure gel", category: "Soins", color: "bg-chart-4/20" },
  { id: "5", title: "Coiffure c&eacute;r&eacute;monie", category: "Coiffure", color: "bg-chart-5/20" },
  { id: "6", title: "Soin visage", category: "Soins", color: "bg-chart-2/20" },
];

const categories = ["Tous", "Coiffure", "Maquillage", "Soins"];

export function GallerySection() {
  return (
    <section id="galerie" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Galerie</Badge>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl md:text-5xl">
            Nos r&eacute;alisations
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            D&eacute;couvrez quelques-unes de nos plus belles r&eacute;alisations. Chaque client est unique, chaque coiffure est une oeuvre d'art.
          </p>
        </div>

        <Tabs defaultValue="Tous" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList>
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat} data-testid={`tab-gallery-${cat.toLowerCase()}`}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {categories.map((cat) => (
            <TabsContent key={cat} value={cat}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {GALLERY_DATA
                  .filter((item) => cat === "Tous" || item.category === cat)
                  .map((item) => (
                    <Card
                      key={item.id}
                      className={`group overflow-hidden hover-elevate aspect-[4/3] ${item.color}`}
                    >
                      <div className="flex h-full items-center justify-center p-6">
                        <div className="text-center">
                          <p className="font-serif text-xl font-semibold">{item.title}</p>
                          <Badge variant="secondary" className="mt-2">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          Suivez-nous sur les r&eacute;seaux sociaux pour plus de r&eacute;alisations
        </p>
      </div>
    </section>
  );
}
