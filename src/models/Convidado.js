import mongoose from "mongoose";

const convidadoSchema = new mongoose.Schema(
  {
    ID: {
      type: Number,
      required: true,
      unique: true,
      index: true,
      min: 1,
    },
    Nome: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    Sobrenome: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },
    ID_Familiar: {
      type: String,
      required: true,
      trim: true,
      index: true,
      minlength: 8,
      maxlength: 100,
    },
    Confirmacao: {
      type: String,
      enum: ["", "confirmado", "nao_comparecera"],
      default: "",
    },
    Filhos: {
      type: String,
      enum: ["", "Sim", "Não"],
      default: "",
    },
    F1: { type: String, default: "", maxlength: 160 },
    F2: { type: String, default: "", maxlength: 160 },
    F3: { type: String, default: "", maxlength: 160 },
    F4: { type: String, default: "", maxlength: 160 },
    F5: { type: String, default: "", maxlength: 160 },
    F6: { type: String, default: "", maxlength: 160 },
    Mensagem: {
      type: String,
      default: "",
      maxlength: 500,
    },
    Data_Confirmacao: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "convidados",
    versionKey: false,
    timestamps: false,
  }
);

convidadoSchema.index({ ID_Familiar: 1, ID: 1 }, { unique: true });

export const Convidado = mongoose.model("Convidado", convidadoSchema);
