import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  UserRound,
  Calendar,
  MapPin,
  FileText,
  Lightbulb,
  Network,
  GitBranch,
  Layers,
  Compass,
  Clock,
} from "lucide-react";

const ParametricVisualization = () => {
  return (
    <Card className="w-full bg-white shadow-md">
      <CardHeader className="bg-slate-50 border-b">
        <CardTitle className="text-center text-xl font-serif">
          CONFLUENCES: A HISTORICAL DATA VISUALIZATION FRAMEWORK
        </CardTitle>
        <p className="text-center text-sm text-muted-foreground">
          A Parametric Approach to Visualizing Historical Interconnections
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3 font-serif">
              CORE ENTITY FRAMEWORK
            </h3>
            <p className="text-sm mb-4">
              The visualization system is built on a comprehensive parametric
              model where history is deconstructed into these key variable
              types:
            </p>

            <div className="space-y-3">
              <EntityVariable
                icon={<UserRound className="h-5 w-5 text-blue-600" />}
                name="$PERSON"
                color="blue"
                description="Historical figures and their attributes, relationships, and lifespans"
                properties={[
                  "$PERSON.name - Full name with variations",
                  "$PERSON.lifespan - Birth and death dates",
                  "$PERSON.nationality - Cultural and political affiliations",
                  "$PERSON.roles - Societal functions",
                  "$PERSON.achievements - Linked events and concepts",
                ]}
              />

              <EntityVariable
                icon={<Calendar className="h-5 w-5 text-red-600" />}
                name="$EVENT"
                color="red"
                description="Discrete historical occurrences with defined start/end timestamps"
                properties={[
                  "$EVENT.name - Canonical name",
                  "$EVENT.timespan - Duration",
                  "$EVENT.location - Geographic anchor(s)",
                  "$EVENT.participants - Key actors",
                  "$EVENT.causes - Linked predecessor events",
                ]}
              />

              <EntityVariable
                icon={<MapPin className="h-5 w-5 text-green-600" />}
                name="$PLACE"
                color="green"
                description="Geographic locations at various scales (city, region, continent)"
                properties={[
                  "$PLACE.name - Location identification",
                  "$PLACE.coordinates - Geospatial positioning",
                  "$PLACE.scale - Size classification",
                  "$PLACE.period - Temporal existence bounds",
                  "$PLACE.connections - Trade routes, cultural exchanges",
                ]}
              />

              <EntityVariable
                icon={<Clock className="h-5 w-5 text-amber-600" />}
                name="$DATE"
                color="amber"
                description="Temporal markers ranging from precise moments to eras and epochs"
                properties={[
                  "$DATE.point - Specific moments",
                  "$DATE.range - Time periods",
                  "$DATE.era - Named epochs",
                  "$DATE.precision - Certainty level",
                  "$DATE.calendar - Reference system",
                ]}
              />

              <EntityVariable
                icon={<Lightbulb className="h-5 w-5 text-purple-600" />}
                name="$CONCEPT"
                color="purple"
                description="Abstract ideas, philosophical movements, and intellectual frameworks"
                properties={[
                  "$CONCEPT.name - Definitional label",
                  "$CONCEPT.period - Temporal emergence and evolution",
                  "$CONCEPT.originators - Associated persons and events",
                  "$CONCEPT.components - Constituent sub-concepts",
                  "$CONCEPT.trajectory - Rise, peak, and decline metrics",
                ]}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3 font-serif">
              VISUAL ENCODING SYSTEM
            </h3>
            <p className="text-sm mb-4">
              Each variable type has a distinct visual treatment for instant
              recognition:
            </p>

            <div className="space-y-4">
              <VisualEncoding
                name="$PERSON"
                color="blue"
                shape="Circular portrait nodes with concentric rings showing influence"
                description="Gold to blue gradient indicating leadership to intellectual roles"
                icon={<UserRound className="h-5 w-5" />}
              />

              <VisualEncoding
                name="$EVENT"
                color="red"
                shape="Diamond nodes with size proportional to historical significance"
                description="Red to purple gradient indicating violence to peaceful transformation"
                icon={<Calendar className="h-5 w-5" />}
              />

              <VisualEncoding
                name="$PLACE"
                color="green"
                shape="Geographic boundary shapes with variable opacity"
                description="Earth tone gradient based on environment"
                icon={<MapPin className="h-5 w-5" />}
              />

              <VisualEncoding
                name="$DATE"
                color="amber"
                shape="Vertical timeline markers with variable width"
                description="Amber gradient showing temporal certainty"
                icon={<Clock className="h-5 w-5" />}
              />

              <VisualEncoding
                name="$CONCEPT"
                color="purple"
                shape="Abstract hexagonal nodes with fractal sub-divisions"
                description="Green to violet gradient indicating material to philosophical nature"
                icon={<Lightbulb className="h-5 w-5" />}
              />
            </div>

            <Separator className="my-6" />

            <div>
              <h3 className="text-lg font-medium mb-3 font-serif">
                QUERY EXAMPLES
              </h3>
              <div className="space-y-2 text-sm font-mono bg-slate-50 p-3 rounded-md">
                <p className="text-xs text-slate-500">
                  // Show Mediterranean events in Renaissance period
                </p>
                <p className="text-blue-600">
                  SHOW $EVENT WHERE $PLACE = "Mediterranean" AND $DATE.range =
                  "1450-1550"
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  // Trace democracy's evolution in modern era
                </p>
                <p className="text-blue-600">
                  TRACE $CONCEPT.trajectory WHERE $CONCEPT = "Democracy" ACROSS
                  $DATE.era = "Modern"
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  // Compare causes of two revolutions
                </p>
                <p className="text-blue-600">
                  COMPARE $EVENT.causes WHERE $EVENT = "French Revolution" AND
                  $EVENT = "American Revolution"
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div>
          <h3 className="text-lg font-medium mb-3 font-serif text-center">
            VISUALIZATION SCENARIOS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <VisualizationScenario
              title="Renaissance Polymaths Network"
              entities={[
                "Leonardo da Vinci",
                "Michelangelo",
                "Raphael",
                "Copernicus",
              ]}
              concepts={[
                "Humanism",
                "Scientific Method",
                "Perspective",
                "Classicism",
              ]}
              dateRange="1450-1550"
              icon={<Network />}
              description="Network showing how Renaissance figures connected to each other and to transformative concepts, with Florence as a spatial anchor."
            />

            <VisualizationScenario
              title="Age of Revolution Comparison"
              entities={[
                "American Revolution",
                "French Revolution",
                "Haitian Revolution",
                "Latin American Revolutions",
              ]}
              concepts={[
                "Liberty",
                "Democracy",
                "Republicanism",
                "Nationalism",
              ]}
              dateRange="1775-1825"
              icon={<GitBranch />}
              description="Flow visualization showing how revolutionary concepts and practices moved geographically and evolved ideologically."
            />

            <VisualizationScenario
              title="Silk Road Cultural Exchange"
              entities={["Silk Road"]}
              concepts={["Buddhism", "Islam", "Paper Making", "Gunpowder"]}
              dateRange="200 BCE - 1400 CE"
              icon={<Compass />}
              description="Space-time visualization showing the bidirectional flow of ideas, technologies, and religions along the Silk Road trading network."
            />
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3 font-serif">
              TECHNICAL IMPLEMENTATION
            </h3>
            <div className="space-y-2">
              <TechComponent
                title="Data Model"
                description="Graph database for entity relationships, temporal database for complex date handling"
                icon={<Layers className="h-5 w-5 text-indigo-600" />}
              />

              <TechComponent
                title="Visualization Engine"
                description="WebGL for high-performance graphics, D3.js for data-driven manipulation"
                icon={<Network className="h-5 w-5 text-blue-600" />}
              />

              <TechComponent
                title="Interaction Paradigm"
                description="Natural language query interface, visual programming blocks for complex inquiries"
                icon={<GitBranch className="h-5 w-5 text-green-600" />}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3 font-serif">
              AESTHETIC TREATMENT
            </h3>
            <div className="space-y-2">
              <TechComponent
                title="Visual Language"
                description="Contemporary data visualization best practices combined with historical cartographic traditions"
                icon={<Compass className="h-5 w-5 text-amber-600" />}
              />

              <TechComponent
                title="Color Strategy"
                description="Primary variable type identification hues with secondary attribute gradients within each type"
                icon={<Layers className="h-5 w-5 text-purple-600" />}
              />

              <TechComponent
                title="Typography"
                description="Variable width fonts for uncertainty visualization, historically appropriate typefaces for different eras"
                icon={<FileText className="h-5 w-5 text-slate-600" />}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface EntityVariableProps {
  icon: React.ReactNode;
  name: string;
  color: string;
  description: string;
  properties: string[];
}

const EntityVariable: React.FC<EntityVariableProps> = ({
  icon,
  name,
  color,
  description,
  properties,
}) => {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    red: "bg-red-50 border-red-200 text-red-800",
    green: "bg-green-50 border-green-200 text-green-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
  };

  return (
    <div className="border rounded-md p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <Badge variant="outline" className={`font-mono ${colorMap[color]}`}>
          {name}
        </Badge>
      </div>
      <p className="text-sm mb-2">{description}</p>
      <div className="text-xs space-y-1 font-mono">
        {properties.map((prop, index) => (
          <div key={index} className="text-slate-700">
            {prop}
          </div>
        ))}
      </div>
    </div>
  );
};

interface VisualEncodingProps {
  name: string;
  color: string;
  shape: string;
  description: string;
  icon: React.ReactNode;
}

const VisualEncoding: React.FC<VisualEncodingProps> = ({
  name,
  color,
  shape,
  description,
  icon,
}) => {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    red: "bg-red-100 text-red-800 border-red-200",
    green: "bg-green-100 text-green-800 border-green-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
  };

  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-full ${colorMap[color]} flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <div className="font-mono text-sm font-medium">{name}</div>
        <div className="text-sm">{shape}</div>
        <div className="text-xs text-slate-600">{description}</div>
      </div>
    </div>
  );
};

interface VisualizationScenarioProps {
  title: string;
  entities: string[];
  concepts: string[];
  dateRange: string;
  icon: React.ReactNode;
  description: string;
}

const VisualizationScenario: React.FC<VisualizationScenarioProps> = ({
  title,
  entities,
  concepts,
  dateRange,
  icon,
  description,
}) => {
  return (
    <div className="border rounded-md p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-slate-100 rounded-full">{icon}</div>
        <h4 className="font-medium">{title}</h4>
      </div>
      <div className="mb-2">
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-800 border-amber-200 mb-1 mr-1"
        >
          {dateRange}
        </Badge>
        {entities.map((entity, i) => (
          <Badge
            key={i}
            variant="outline"
            className="bg-blue-50 text-blue-800 border-blue-200 mb-1 mr-1"
          >
            {entity}
          </Badge>
        ))}
      </div>
      <div className="mb-2">
        {concepts.map((concept, i) => (
          <Badge
            key={i}
            variant="outline"
            className="bg-purple-50 text-purple-800 border-purple-200 mb-1 mr-1"
          >
            {concept}
          </Badge>
        ))}
      </div>
      <p className="text-xs text-slate-600">{description}</p>
    </div>
  );
};

interface TechComponentProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const TechComponent: React.FC<TechComponentProps> = ({
  title,
  description,
  icon,
}) => {
  return (
    <div className="flex items-start gap-3">
      <div className="p-1.5 bg-slate-100 rounded-full flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-slate-600">{description}</div>
      </div>
    </div>
  );
};

export default ParametricVisualization;
