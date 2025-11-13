// src/features/modals/NodeModal/index.tsx

import React from "react";
import type { ModalProps } from "@mantine/core";

import type { NodeData } from "../../../types/graph";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import NodeContentModal from "../NodeContentModal";
import { updateJsonAtPath } from "../../../lib/utils/updateByJsonPath";

/**
 * Build the value we want to expose for editing.
 * - If the node is a single scalar (no key) → return that scalar
 * - Otherwise return an object of only primitive fields (no array/object children)
 *   e.g. { name: "Apple", color: "#FF0000" }
 */
function buildEditableValue(nodeData: NodeData | null): any | null {
  const rows = nodeData?.text;
  if (!rows || rows.length === 0) return null;

  // Single primitive value node (no key)
  if (rows.length === 1 && !rows[0].key) {
    return rows[0].value;
  }

  // Object-like node: only keep primitive fields, skip array/object children
  const obj: Record<string, any> = {};
  rows.forEach(row => {
    if (row.key && row.type !== "array" && row.type !== "object") {
      obj[row.key] = row.value;
    }
  });

  return obj;
}

/** Convert NodeData.path into a JSONPath-like string: $["fruits"][0]["name"] */
function jsonPathToString(path?: NodeData["path"]): string {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
}

/** Get the full value at a NodeData.path from a parsed JSON root */
function getValueAtPath(root: any, path?: (string | number)[]): any {
  if (!path || path.length === 0) return root;
  let current = root;
  for (const key of path) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as any)[key as any];
  }
  return current;
}

export const NodeModal: React.FC<ModalProps> = ({ opened = false, onClose }) => {
  const nodeData = useGraph(state => state.selectedNode);
  const { getJson, setJson } = useJson();

  const editableValue = React.useMemo(() => buildEditableValue(nodeData), [nodeData]);
  const jsonPath = React.useMemo(
    () => (nodeData ? jsonPathToString(nodeData.path) : null),
    [nodeData]
  );

  const handleSave = (updatedValue: any) => {
    if (!nodeData || !jsonPath) return;

    const currentJson = getJson();
    let root: any;

    try {
      root = currentJson ? JSON.parse(currentJson) : {};
    } catch {
      // If the current JSON is somehow invalid, bail out gracefully
      return;
    }

    // Full object currently at this path in the JSON (may be primitive)
    const currentAtPath = getValueAtPath(root, nodeData.path);

    let mergedValue: any;

    // If the node is an object, merge primitive updates into it so we don't
    // lose nested fields like "details" or "nutrients"
    if (
      currentAtPath &&
      typeof currentAtPath === "object" &&
      !Array.isArray(currentAtPath) &&
      updatedValue &&
      typeof updatedValue === "object" &&
      !Array.isArray(updatedValue)
    ) {
      mergedValue = {
        ...currentAtPath,
        ...updatedValue,
      };
    } else {
      // Scalar node or something non-object → just replace with the new value
      mergedValue = updatedValue;
    }

    const newRoot = updateJsonAtPath(root, jsonPath, mergedValue);
    const newJson = JSON.stringify(newRoot, null, 2);

    // This will also re-parse and refresh the graph view
    setJson(newJson);

    if (onClose) onClose();
  };

  // If no node is selected, just render nothing (modal will effectively be closed)
  if (!nodeData) {
    return (
      <NodeContentModal
        opened={false}
        onClose={onClose ?? (() => {})}
        value={null}
        jsonPath={null}
        onSave={() => {}}
      />
    );
  }

  return (
    <NodeContentModal
      opened={opened}
      onClose={onClose ?? (() => {})}
      value={editableValue}
      jsonPath={jsonPath}
      onSave={handleSave}
    />
  );
};

export default NodeModal;
