import mongoose from "mongoose";

const revenueTargetSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [2020, "Year must be 2020 or later"],
      max: [2100, "Year must be 2100 or earlier"],
    },
    lawFirm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LawFirm",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: false, // null for law firm-wide targets
    },
    yearlyTarget: {
      type: Number,
      required: [true, "Yearly target is required"],
      min: [0, "Yearly target cannot be negative"],
    },
    monthlyTargets: [
      {
        month: {
          type: Number,
          required: true,
          min: 1,
          max: 12,
        },
        target: {
          type: Number,
          required: true,
          min: 0,
        },
        weeklyTargets: [
          {
            week: {
              type: Number,
              required: true,
              min: 1,
              max: 5,
            },
            target: {
              type: Number,
              required: true,
              min: 0,
            },
            dailyTargets: [
              {
                day: {
                  type: Number,
                  required: true,
                  min: 1,
                  max: 31,
                },
                target: {
                  type: Number,
                  required: true,
                  min: 0,
                },
              },
            ],
          },
        ],
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one target per year per department per law firm
revenueTargetSchema.index(
  { year: 1, lawFirm: 1, department: 1 },
  { unique: true, sparse: true }
);

// Method to calculate monthly breakdown (divide yearly by 12)
revenueTargetSchema.methods.calculateMonthlyTargets = function () {
  const monthlyAmount = this.yearlyTarget / 12;
  const monthlyTargets = [];

  for (let month = 1; month <= 12; month++) {
    const daysInMonth = new Date(this.year, month, 0).getDate();
    const weeksInMonth = Math.ceil(daysInMonth / 7);
    const weeklyAmount = monthlyAmount / weeksInMonth;
    const dailyAmount = monthlyAmount / daysInMonth;

    const weeklyTargets = [];
    let dayCounter = 1;

    for (let week = 1; week <= weeksInMonth; week++) {
      const daysInWeek = Math.min(7, daysInMonth - dayCounter + 1);
      const weekDailyTargets = [];

      for (let day = 1; day <= daysInWeek; day++) {
        weekDailyTargets.push({
          day: dayCounter,
          target: dailyAmount,
        });
        dayCounter++;
      }

      weeklyTargets.push({
        week,
        target: weeklyAmount,
        dailyTargets: weekDailyTargets,
      });
    }

    monthlyTargets.push({
      month,
      target: monthlyAmount,
      weeklyTargets,
    });
  }

  this.monthlyTargets = monthlyTargets;
  return this;
};

export default mongoose.model("RevenueTarget", revenueTargetSchema);


