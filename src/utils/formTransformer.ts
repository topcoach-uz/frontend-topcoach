import { IFormItemType } from "src/components/form/type";
import {
  EventFormsSchema,
  EventInputTypeEnum,
  AdditionalEventFormsSchema,
  EssaysSchema,
} from "src/app/api/Api";
import { FormInstance, UploadFile } from "antd";

// Define translation interface for type safety
interface TranslationObject {
  en?: string;
  kk?: string;
  ru?: string;
  uz?: string;
}

/**
 * Transforms backend form data into IFormItemType[] format for dynamic form generation
 * @param forms - EventFormsSchema containing additionalForms and essays
 * @param currentLocale - Current language locale
 * @returns Object containing transformed form items and essays
 */
export function transformFormItems(
  forms: EventFormsSchema,
  currentLocale: "en" | "kk" | "ru" | "uz" = "en",
  form: FormInstance
): {
  formItems: IFormItemType[];
  formItemEssay: IFormItemType[];
} {
  // Transform additional forms
  const transformedFormItems: IFormItemType[] =
    forms.additionalForms.map(
      (additionalForm: AdditionalEventFormsSchema) => {
        const labelObj = additionalForm.label as TranslationObject;
        const label =
          labelObj?.[currentLocale] || labelObj?.en || "Field";

        const notesObj = additionalForm.notes as TranslationObject;
        const notes = notesObj?.[currentLocale] || notesObj?.en;

        let type:
          | "upload"
          | "select"
          | "input"
          | "datePicker"
          | "rangePicker"
          | "imageUpload"
          | "avatarUpload"
          | "checkbox"
          | "button" = "input";
        let inputType:
          | "password"
          | "otp"
          | "mask"
          | "textarea"
          | "text"
          | "number"
          | undefined = "text";
        let options:
          | Array<{ label: string; value: string }>
          | undefined;
        const otherProperties: Partial<IFormItemType> = {};

        switch (additionalForm.inputType) {
          case EventInputTypeEnum.Text:
            type = "input";
            inputType = "text";
            break;
          case EventInputTypeEnum.LargeText:
            type = "input";
            inputType = "textarea";
            break;
          case EventInputTypeEnum.File:
            type = "upload";
            inputType = undefined;
            otherProperties.maxCount = 1;
            break;
          case EventInputTypeEnum.Image:
            type = "imageUpload";
            inputType = undefined;
            break;
          case EventInputTypeEnum.Date:
            type = "datePicker";
            inputType = undefined;
            break;
          case EventInputTypeEnum.MultipleChoice:
            type = "select";
            inputType = undefined;
            otherProperties.mode = "multiple";
            options = additionalForm.options?.map((option) => ({
              label: option,
              value: option.toLowerCase().replace(/\s+/g, "_"),
            }));
            break;
          case EventInputTypeEnum.SingleChoice:
            type = "select";
            inputType = undefined;
            options = additionalForm.options?.map((option) => ({
              label: option,
              value: option.toLowerCase().replace(/\s+/g, "_"),
            }));
            break;
          default:
            type = "input";
            inputType = "text";
        }

        const formItem: IFormItemType = {
          name: `additional_${additionalForm.id}`,
          label,
          form,
          type,
          ...(inputType && { inputType }),
          message: `Please enter ${label.toLowerCase()}`,
          placeholder: notes || `Enter ${label.toLowerCase()}`,
          col: 12, // Default column span
          ...otherProperties,
          ...(options && { options }),
          ...(additionalForm.inputType ===
            EventInputTypeEnum.LargeText && {
            row: 4,
          }),
        };

        return formItem;
      }
    );

  // Transform essays
  const transformedEssays: IFormItemType[] = forms.essays.map(
    (essay: EssaysSchema) => {
      const formItem: IFormItemType = {
        name: `essay_${essay.id}`,
        label: essay.title,
        type: "input",
        inputType: "textarea",
        message: "Please provide your response for this field",
        placeholder: "Enter your response here...",
        col: 24, // Full width for essays
        row: 6, // More rows for essays
        rules: [
          {
            validator: (_, value) => {
              const wordCount = value
                ? value.trim().split(/\s+/).length
                : 0;
              if (wordCount > essay.maxWordLimit) {
                return Promise.reject(
                  new Error(
                    `Maximum word limit is ${essay.maxWordLimit}`
                  )
                );
              }
              return Promise.resolve();
            },
          },
        ],
      };

      return formItem;
    }
  );

  return {
    formItems: transformedFormItems,
    formItemEssay: transformedEssays,
  };
}

/**
 * Helper function to get form data structure for submission
 * @param formValues - Values from the Ant Design form
 * @param formSchema - Original form schema from backend
 * @returns Object with structured data for API submission
 */
export function prepareFormDataForSubmission(
  formValues: Record<string, unknown>,
  formSchema: EventFormsSchema
): {
  additionalResponses: Array<{ id: string; response: unknown }>;
  essays: Array<{ essayId: string; content: string }>;
} {
  // Extract additional form responses
  const additionalResponses = formSchema.additionalForms
    .filter(
      (form) =>
        form.inputType !== EventInputTypeEnum.Image &&
        form.inputType !== EventInputTypeEnum.File
    )
    .map((form) => ({
      id: form.id,
      response: formValues[`additional_${form.id}`] || "",
    }));

  // Extract essay responses
  const essays = formSchema.essays.map((essay) => ({
    essayId: essay.id,
    content: (formValues[`essay_${essay.id}`] as string) || "",
  }));

  return {
    additionalResponses,
    essays,
  };
}

/**
 * Helper function to check if form contains file upload fields
 * @param forms - EventFormsSchema containing additionalForms
 * @returns boolean indicating if there are file upload fields
 */
export function hasFileUploadFields(
  forms: EventFormsSchema
): boolean {
  return forms.additionalForms.some(
    (form) =>
      form.inputType === EventInputTypeEnum.File ||
      form.inputType === EventInputTypeEnum.Image
  );
}

/**
 * Helper function to create dynamic submission payload for graduate forms
 * @param formValues - Values from the Ant Design form
 * @param formSchema - Original form schema from backend
 * @returns Complete payload for API submission
 */
export function createDynamicSubmissionPayload(
  formValues: Record<string, unknown>,
  formSchema: EventFormsSchema
): {
  additionalResponses: Array<{ id: string; response: unknown }>;
  essays: Array<{ essayId: string; content: string }>;
  fileUploads: Record<string, unknown>;
} {
  const { additionalResponses, essays } =
    prepareFormDataForSubmission(formValues, formSchema);

  // Extract file uploads separately (they need special handling)
  const fileUploads: Record<string, unknown> = {};
  formSchema.additionalForms.forEach((form) => {
    if (
      form.inputType === EventInputTypeEnum.File ||
      form.inputType === EventInputTypeEnum.Image
    ) {
      const fieldValue = formValues[`additional_${form.id}`];
      if (fieldValue) {
        fileUploads[form.id] =
          form.inputType === EventInputTypeEnum.File
            ? (fieldValue as { file?: unknown })?.file || fieldValue
            : (fieldValue as UploadFile[])?.[0]?.originFileObj ||
              fieldValue;
      }
    }
  });

  return {
    additionalResponses,
    essays,
    fileUploads,
  };
}

// Utility to move file upload fields to the end of formItems
export function sortFormItemsFileUploadLast(formItems: any[]) {
  if (!Array.isArray(formItems) || formItems.length < 2)
    return formItems;
  const fileUploads = [];
  const others = [];
  for (let i = 0; i < formItems.length; i++) {
    if (formItems[i]?.type === "upload") {
      fileUploads.push(formItems[i]);
    } else {
      others.push(formItems[i]);
    }
  }
  return others.concat(fileUploads);
}
