import * as React from "react";

const TabsContext = React.createContext(null);
const TabsListContext = React.createContext({ variant: "default" });

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Tabs({
  value,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  className = "",
  children,
  ...props
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? value);
  const selectedValue = value !== undefined ? value : internalValue;

  const setSelectedValue = React.useCallback(
    (nextValue) => {
      if (value === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [onValueChange, value]
  );

  const contextValue = React.useMemo(
    () => ({ value: selectedValue, onValueChange: setSelectedValue }),
    [selectedValue, setSelectedValue]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        data-slot="tabs"
        data-orientation={orientation}
        className={cn(
          orientation === "vertical" ? "flex flex-row gap-2" : "flex flex-col gap-2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ variant = "default", className = "", children, ...props }) {
  const isLine = variant === "line";

  return (
    <TabsListContext.Provider value={{ variant }}>
      <div
        data-slot="tabs-list"
        data-variant={variant}
        role="tablist"
        className={cn(
          isLine
            ? "inline-flex w-fit items-center justify-center gap-1 rounded-none bg-transparent p-[3px] text-muted-foreground"
            : "inline-flex h-8 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </TabsListContext.Provider>
  );
}

function TabsTrigger({ value, className = "", children, type = "button", ...props }) {
  const context = React.useContext(TabsContext);
  const { variant } = React.useContext(TabsListContext);
  const isActive = context?.value === value;
  const isLine = variant === "line";

  return (
    <button
      data-slot="tabs-trigger"
      role="tab"
      type={type}
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      data-active={isActive ? "true" : undefined}
      className={cn(
        isLine
          ? "relative inline-flex flex-none items-center justify-center gap-1.5 border-0 bg-transparent p-0 text-sm font-medium whitespace-nowrap text-foreground/60 shadow-none outline-none transition-colors hover:bg-transparent hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 after:absolute after:inset-x-0 after:bottom-[-5px] after:h-0.5 after:bg-foreground after:opacity-0 after:transition-opacity data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          : "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      onClick={() => context?.onValueChange?.(value)}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, className = "", children, ...props }) {
  const context = React.useContext(TabsContext);
  const isActive = context?.value === value;

  if (!isActive) return null;

  return (
    <div
      data-slot="tabs-content"
      role="tabpanel"
      data-state="active"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
