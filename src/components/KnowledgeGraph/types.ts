export class Node {
  constructor(props) {
    this.id = props.id;
    this.type = props.type;
    this.label = props.label;
    this.x = props.x;
    this.y = props.y;
    this.description = props.description;
    this.image = props.image;
    this.date = props.date;
    this.isNew = props.isNew;
    this.isEditing = props.isEditing;
  }
}

export class Edge {
  constructor(props) {
    this.id = props.id;
    this.source = props.source;
    this.target = props.target;
    this.relationship = props.relationship;
    this.isNew = props.isNew;
    this.isEditing = props.isEditing;
  }
}

export class KnowledgeGraphProps {
  constructor(props) {
    this.nodes = props.nodes || [];
    this.edges = props.edges || [];
    this.onNodeSelect = props.onNodeSelect;
    this.onNodeCreate = props.onNodeCreate;
    this.onNodeUpdate = props.onNodeUpdate;
    this.onNodeDelete = props.onNodeDelete;
    this.onEdgeCreate = props.onEdgeCreate;
    this.onEdgeUpdate = props.onEdgeUpdate;
    this.onEdgeDelete = props.onEdgeDelete;
  }
}
