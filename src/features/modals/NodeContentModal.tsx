// src/features/modals/NodeContentModal.tsx

import React from "react";
import {
  Modal,
  Button,
  Group,
  TextInput,
  Text,
  Stack,
  Code,
} from "@mantine/core";

interface NodeContentModalProps {
  opened: boolean;
  onClose: () => void;

  // The value stored at that node (usually an object)
  value: any | null;

  // JSON path string like ${["fruits"][0]}
  jsonPath: string | null;

  // Called when the user saves changes
  onSave: (updatedValue: any) => void;
}

const NodeContentModal: React.FC<NodeContentModalProps> = ({
  opened,
  onClose,
  value,
  jsonPath,
  onSave,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [fields, setFields] = React.useState<Record<string, string>>({});

  // Whenever we open the modal or change node, reset local form state
  React.useEffect(() => {
    if (!opened) {
      setIsEditing(false);
      setFields({});
      return;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const next: Record<string, string> = {};
      Object.entries(value).forEach(([key, v]) => {
        next[key] = v == null ? "" : String(v);
      });
      setFields(next);
    } else {
      // Primitive value: treat as single field called "value"
      setFields({ value: value == null ? "" : String(value) });
    }
  }, [opened, value]);

  const handleFieldChange = (key: string, newVal: string) => {
    setFields((prev) => ({ ...prev, [key]: newVal }));
  };

  const handleCancelEdit = () => {
    // Discard edits and go back to JSON view
    setIsEditing(false);

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const reset: Record<string, string> = {};
      Object.entries(value).forEach(([key, v]) => {
        reset[key] = v == null ? "" : String(v);
      });
      setFields(reset);
    } else {
      setFields({ value: value == null ? "" : String(value) });
    }
  };

  const handleSave = () => {
    let updated: any;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      updated = { ...(value as any) };
      Object.entries(fields).forEach(([key, text]) => {
        const trimmed = text.trim();
        let parsed: any;

        if (trimmed === "") {
          parsed = "";
        } else {
          // Try to parse as JSON literal, fall back to string
          try {
            parsed = JSON.parse(trimmed);
          } catch {
            parsed = text;
          }
        }

        updated[key] = parsed;
      });
    } else {
      const onlyKey = Object.keys(fields)[0];
      const text = fields[onlyKey];
      const trimmed = text.trim();
      try {
        updated = JSON.parse(trimmed);
      } catch {
        updated = text;
      }
    }

    onSave(updated);
    setIsEditing(false);
  };

  const prettyJson =
    value !== undefined ? JSON.stringify(value, null, 2) : "";

  return (
    <Modal
      opened={opened}
      onClose={() => {
        setIsEditing(false);
        onClose();
      }}
      title="Content"
      centered
      size="lg"
    >
      {/* VIEW MODE: pretty JSON + Edit button */}
      {!isEditing && (
        <Stack gap="sm">
          <Text fw={600}>Content</Text>

          <pre
            style={{
              margin: 0,
              padding: "12px 16px",
              background: "#141414",
              borderRadius: 8,
              fontSize: 13,
              maxHeight: 260,
              overflow: "auto",
            }}
          >
            <code>{prettyJson}</code>
          </pre>

          <Text fw={600} mt="sm">
            JSON Path
          </Text>
          <Code>{jsonPath ?? "-"}</Code>

          <Group justify="flex-end" mt="md">
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
          </Group>
        </Stack>
      )}

      {/* EDIT MODE: individual fields + Save / Cancel */}
      {isEditing && (
        <Stack gap="sm">
          {Object.entries(fields).map(([key, val]) => (
            <div key={key}>
              <Text fw={600} mb={4}>
                {key}
              </Text>
              <TextInput
                value={val}
                onChange={(e) =>
                  handleFieldChange(key, e.currentTarget.value)
                }
              />
            </div>
          ))}

          <Text fw={600} mt="sm">
            JSON Path
          </Text>
          <Code>{jsonPath ?? "-"}</Code>

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" color="gray" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button color="green" onClick={handleSave}>
              Save
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
};

export default NodeContentModal;
