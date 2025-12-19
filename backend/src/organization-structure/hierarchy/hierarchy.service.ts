import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Department } from '../models/department.schema';
import { Position } from '../models/position.schema';

// This is how a node in the tree looks (one position + its children)
export interface PositionNode {
  _id: string;
  title: string;
  code?: string;
  payGrade?: string;
  reportingTo?: string | null;
  children: PositionNode[];
}

// This is the structure we return per department
export interface DepartmentHierarchy {
  _id: string;
  name: string;
  code?: string;
  positions: PositionNode[];
}

@Injectable()
export class HierarchyService {
  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<Department>,
    @InjectModel(Position.name)
    private readonly positionModel: Model<Position>,
  ) {}

  /**
   * Get full hierarchy:
   * [
   *   {
   *     _id: deptId,
   *     name: "Engineering",
   *     code: "ENG",
   *     positions: [ ...tree of positions... ]
   *   },
   *   ...
   * ]
   */
  async getOrgHierarchy(): Promise<DepartmentHierarchy[]> {
    // 1) Get all departments and positions from DB
    const departments = await this.departmentModel.find().lean();
    const positions = await this.positionModel.find().lean();

    // 2) Group positions by departmentId
    const positionsByDept = new Map<string, any[]>();
    positions.forEach((p) => {
      const key = String(p.departmentId); // may be department or deptId based on your schema
      if (!positionsByDept.has(key)) positionsByDept.set(key, []);
      positionsByDept.get(key)!.push(p);
    });

    const result: DepartmentHierarchy[] = [];

    // 3) For each department, build its position tree
    for (const dept of departments) {
      const deptPositions = positionsByDept.get(String(dept._id)) || [];
      const tree = this.buildPositionTree(deptPositions);

      result.push({
        _id: String(dept._id),
        name: (dept as any).name,
        code: (dept as any).code,
        positions: tree,
      });
    }

    return result;
  }

  /**
   * Get hierarchy for a single position (its subtree inside its department).
   * If you ask for a manager → you get that manager + all their children recursively.
   */
  async getPositionHierarchy(positionId: string): Promise<PositionNode | null> {
    // basic check that the id is a valid Mongo ObjectId
    if (!Types.ObjectId.isValid(positionId)) return null;

    const position = await this.positionModel.findById(positionId).lean();
    if (!position) return null;

    // Get all positions in the same department
    const deptPositions = await this.positionModel
      .find({ departmentId: position.departmentId })
      .lean();

    // Build the tree for that department
    const tree = this.buildPositionTree(deptPositions);

    // Helper to search recursively in the tree for our position
    const findNode = (nodes: PositionNode[]): PositionNode | null => {
      for (const node of nodes) {
        if (node._id === String(position._id)) return node;
        const found = findNode(node.children);
        if (found) return found;
      }
      return null;
    };

    return findNode(tree);
  }

  /**
   * Internal helper: given a flat list of positions in *one* department,
   * build a tree based on reportingTo.
   */
  private buildPositionTree(flatPositions: any[]): PositionNode[] {
    const nodeMap = new Map<string, PositionNode>();

    // 1) Convert each position document into a PositionNode
    flatPositions.forEach((p) => {
      nodeMap.set(String(p._id), {
        _id: String(p._id),
        title: p.title,
        code: p.code,
        payGrade: p.payGrade,
        reportingTo: p.reportingTo ? String(p.reportingTo) : null,
        children: [],
      });
    });

    const roots: PositionNode[] = [];

    // 2) Link children to parents
    nodeMap.forEach((node) => {
      if (node.reportingTo && nodeMap.has(node.reportingTo)) {
        // Node has a manager inside same department → attach as child
        nodeMap.get(node.reportingTo)!.children.push(node);
      } else {
        // No manager or manager not in this dept → top-level
        roots.push(node);
      }
    });

    return roots;
  }
}
