
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AlgorithmConfiguration from "./AlgorithmConfiguration";
import NumberRangeConfiguration from "./NumberRangeConfiguration";
import LimitConfiguration from "./LimitConfiguration";
import PatternConfiguration from "./PatternConfiguration";

const AdvancedConfiguration = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlgorithmConfiguration />
        <NumberRangeConfiguration />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LimitConfiguration />
        <PatternConfiguration />
      </div>
    </div>
  );
};

export default AdvancedConfiguration;
